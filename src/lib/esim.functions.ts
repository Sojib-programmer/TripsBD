import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Countries we surface first. Any ISO2 code still works. */
export const ESIM_COUNTRIES = [
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "IN", name: "India" },
  { code: "NP", name: "Nepal" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Türkiye" },
  { code: "JP", name: "Japan" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "BD", name: "Bangladesh" },
] as const;

/** Public: live plan list for one country. */
export const listEsimPackages = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ country: z.string().regex(/^[A-Z]{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { listPackages } = await import("./esim.server");
    try {
      return { plans: await listPackages(data.country), error: null as string | null };
    } catch (e) {
      console.error("eSIM list failed", e instanceof Error ? e.message : e);
      return { plans: [], error: "Plans are unavailable right now. Try again shortly." };
    }
  });

/** Creates a priced, payable eSIM order. Price comes from the provider, never the client. */
export const createEsimOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        packageCode: z.string().trim().min(2).max(40),
        contactName: z.string().trim().min(2).max(100),
        contactPhone: z.string().trim().min(8).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { getPackage } = await import("./esim.server");
    const pkg = await getPackage(data.packageCode);
    if (!pkg) throw new Error("This plan is no longer available.");
    const email = (context.claims as { email?: string }).email;
    if (!email) throw new Error("Your account has no email address.");

    const { data: order, error } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        vertical: "esim",
        title: `${pkg.country} eSIM · ${pkg.dataGb} GB`,
        subtitle: `${pkg.days} days · ${pkg.speed}`,
        starts_at: new Date().toISOString(),
        travellers: 1,
        total_bdt: pkg.priceBdt,
        contact_name: data.contactName,
        contact_email: email,
        contact_phone: data.contactPhone,
        details: {} as never,
      })
      .select("id, reference")
      .single();
    if (error || !order) throw new Error("Could not create the order.");

    // Digital product with a supplier-fixed price: confirm immediately so it can be paid.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "confirmed",
        details: { esim: { packageCode: pkg.code, country: pkg.locationCode } } as never,
      })
      .eq("id", order.id);
    if (upErr) throw new Error("Could not confirm the order.");
    return { reference: order.reference };
  });

type EsimDetails = {
  packageCode?: string;
  orderNo?: string;
  iccid?: string;
  activationCode?: string;
  qrCodeUrl?: string;
  error?: string;
};

/**
 * Install details for the owner's paid eSIM order. Idempotently places the
 * supplier order once a verified payment exists, then polls for the profile.
 */
export const getEsimInstall = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reference: z.string().min(4).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, reference, vertical, status, details, user_id")
      .eq("reference", data.reference)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!order || order.vertical !== "esim") return { state: "none" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: paid } = await supabaseAdmin
      .from("payment_records")
      .select("id")
      .eq("reference", order.reference)
      .eq("kind", "order")
      .eq("status", "paid")
      .maybeSingle();
    if (!paid) return { state: "unpaid" as const };

    const details = (order.details ?? {}) as { esim?: EsimDetails };
    const esim: EsimDetails = { ...(details.esim ?? {}) };
    if (esim.activationCode)
      return {
        state: "ready" as const,
        iccid: esim.iccid ?? null,
        activationCode: esim.activationCode,
        qrCodeUrl: esim.qrCodeUrl ?? null,
      };
    if (!esim.packageCode) return { state: "issue" as const };

    const { placeOrder, queryProfile } = await import("./esim.server");
    const save = (next: EsimDetails) =>
      supabaseAdmin
        .from("orders")
        .update({ details: { ...details, esim: next } as never })
        .eq("id", order.id);

    try {
      if (!esim.orderNo) {
        esim.orderNo = await placeOrder(order.reference, esim.packageCode);
        delete esim.error;
        await save(esim);
        await supabaseAdmin.from("order_events").insert({
          order_id: order.id,
          status: "confirmed",
          message: "eSIM ordered from our network partner.",
        });
      }
      const profile = await queryProfile(esim.orderNo);
      if (!profile?.activationCode) return { state: "issuing" as const };
      Object.assign(esim, {
        iccid: profile.iccid ?? undefined,
        activationCode: profile.activationCode,
        qrCodeUrl: profile.qrCodeUrl ?? undefined,
      });
      await save(esim);
      await supabaseAdmin.from("notifications").insert({
        user_id: order.user_id,
        title: "Your eSIM is ready",
        body: `Scan the QR code on reference ${order.reference} to install it.`,
        order_reference: order.reference,
      });
      return {
        state: "ready" as const,
        iccid: esim.iccid ?? null,
        activationCode: esim.activationCode!,
        qrCodeUrl: esim.qrCodeUrl ?? null,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      console.error("eSIM fulfilment failed", order.reference, msg);
      if (esim.error !== msg) await save({ ...esim, error: msg });
      return { state: "issue" as const };
    }
  });
