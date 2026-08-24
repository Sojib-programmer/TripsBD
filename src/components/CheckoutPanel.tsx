import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { bdt } from "@/lib/format";
import { createOrder } from "@/lib/orders.functions";

type Vertical = "stay" | "flight" | "package" | "activity" | "transfer" | "car" | "esim" | "train";

export type CheckoutDraft = {
  vertical: Vertical;
  itemId?: string | null;
  title: string;
  subtitle?: string;
  heroUrl?: string;
  startsAt: string;
  endsAt?: string;
  travellers: number;
  totalBdt: number;
  details?: Record<string, unknown>;
};

/**
 * Shared request-to-book panel. Every vertical funnels through `orders`,
 * so the confirmation screen and the trips feed stay identical across products.
 */
export function CheckoutPanel({
  draft,
  breakdown,
  cta = "Request to book",
}: {
  draft: CheckoutDraft;
  breakdown: { label: string; value: string }[];
  cta?: string;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const submit = useServerFn(createOrder);

  const [name, setName] = useState(
    (user?.user_metadata?.["full_name"] as string | undefined) ?? "",
  );
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          vertical: draft.vertical,
          itemId: draft.itemId ?? null,
          title: draft.title,
          ...(draft.subtitle ? { subtitle: draft.subtitle } : {}),
          ...(draft.heroUrl ? { heroUrl: draft.heroUrl } : {}),
          startsAt: draft.startsAt,
          ...(draft.endsAt ? { endsAt: draft.endsAt } : {}),
          travellers: draft.travellers,
          totalBdt: draft.totalBdt,
          contactName: name,
          contactEmail: email,
          ...(phone ? { contactPhone: phone } : {}),
          details: draft.details ?? {},
        },
      }),
    onSuccess: (order) => {
      toast.success("Request sent", { description: `Reference ${order.reference}` });
      void navigate({ to: "/order/$reference", params: { reference: order.reference } });
    },
    onError: (e: Error) => toast.error("Could not send request", { description: e.message }),
  });

  if (loading) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-border p-5">
        <p className="text-[17px] font-semibold text-foreground">Sign in to continue</p>
        <p className="mt-1 text-[15px] text-muted-foreground">
          We keep your bookings, status updates and receipts in one place.
        </p>
        <Link
          to="/auth"
          className="mt-4 block rounded-full bg-brand py-3 text-center text-[17px] font-semibold text-brand-foreground"
        >
          Sign in / Sign up
        </Link>
      </div>
    );
  }

  const valid = name.trim().length > 1 && /.+@.+\..+/.test(email);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-4">
        {breakdown.map((b) => (
          <div key={b.label} className="flex justify-between py-1 text-[15px]">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="text-foreground">{b.value}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <span className="text-[17px] font-semibold text-foreground">Total</span>
          <span className="text-[22px] font-bold text-foreground">{bdt(draft.totalBdt)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-border px-4 py-3 text-[16px] text-foreground outline-none focus:border-brand"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-border px-4 py-3 text-[16px] text-foreground outline-none focus:border-brand"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="Phone (optional)"
          className="w-full rounded-xl border border-border px-4 py-3 text-[16px] text-foreground outline-none focus:border-brand"
        />
      </div>

      <button
        type="button"
        disabled={!valid || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="w-full rounded-full bg-brand py-4 text-[17px] font-semibold text-brand-foreground disabled:opacity-50"
      >
        {mutation.isPending ? "Sending…" : cta}
      </button>
      <p className="text-center text-[13px] text-muted-foreground">
        No payment now — we confirm availability, then send a payment link.
      </p>
    </div>
  );
}
