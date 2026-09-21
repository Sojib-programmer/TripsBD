import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MESSAGES_PER_DAY = 5;

type Db = SupabaseClient<Database>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return out;
  for (let d = s; d <= e && out.length < 30; d = new Date(d.getTime() + 86_400_000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function safeHero(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("https://images.unsplash.com/") ? url.slice(0, 400) : null;
}

export const listMyPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("trip_plans")
      .select("id, title, destination, start_date, end_date, hero_url, status, updated_at")
      .order("updated_at", { ascending: false });
    return data ?? [];
  });

export const getPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ planId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: plan } = await sb
      .from("trip_plans")
      .select("id, title, destination, start_date, end_date, hero_url, status, updated_at")
      .eq("id", data.planId)
      .maybeSingle();
    if (!plan) return null;

    const [{ data: days }, { data: spots }, { data: messages }] = await Promise.all([
      sb
        .from("trip_plan_days")
        .select("id, date, sort_order")
        .eq("plan_id", plan.id)
        .order("date", { ascending: true }),
      sb
        .from("trip_plan_spots")
        .select(
          "id, day_id, name, spot_type, type_label, address, slot_index, listing:listings(slug, title), activity:activities(slug, title)",
        )
        .eq("plan_id", plan.id)
        .order("slot_index", { ascending: true }),
      sb
        .from("trip_plan_messages")
        .select("id, role, content, created_at")
        .eq("plan_id", plan.id)
        .order("created_at", { ascending: true }),
    ]);

    return { plan, days: days ?? [], spots: spots ?? [], messages: messages ?? [] };
  });

export const createPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trip_plans")
      .insert({ user_id: context.userId })
      .select("id")
      .single();
    if (error) {
      throw new Error(
        error.message.includes("Free plan limit")
          ? "You can keep up to 3 trip plans on the free tier. Delete one to start another."
          : error.message,
      );
    }
    await context.supabase.rpc("increment_trips_created");
    return data;
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ planId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await context.supabase.from("trip_plans").delete().eq("id", data.planId);
    return { ok: true };
  });

export const deleteSpot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ spotId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await context.supabase.from("trip_plan_spots").delete().eq("id", data.spotId);
    return { ok: true };
  });

export const moveSpot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        spotId: z.string().uuid(),
        dayId: z.string().uuid(),
        slotIndex: z.number().int().min(0).max(30),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("trip_plan_spots")
      .update({ day_id: data.dayId, slot_index: data.slotIndex })
      .eq("id", data.spotId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendPlannerMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ planId: z.string().uuid(), message: z.string().min(2).max(1000) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const userId = context.userId;

    const { data: usage } = await sb
      .from("usage_counters")
      .select("messages_sent")
      .eq("user_id", userId)
      .eq("date", todayISO())
      .maybeSingle();
    if ((usage?.messages_sent ?? 0) >= MESSAGES_PER_DAY) {
      return {
        limited: true as const,
        message: `You've used your ${MESSAGES_PER_DAY} free planning messages for today. They reset tomorrow.`,
      };
    }

    const { data: plan } = await sb
      .from("trip_plans")
      .select("id, title, destination, start_date, end_date")
      .eq("id", data.planId)
      .maybeSingle();
    if (!plan) throw new Error("Plan not found");

    await sb
      .from("trip_plan_messages")
      .insert({ plan_id: plan.id, user_id: userId, role: "user", content: data.message });
    await sb.rpc("increment_messages_today");

    const { data: history } = await sb
      .from("trip_plan_messages")
      .select("role, content")
      .eq("plan_id", plan.id)
      .order("created_at", { ascending: true })
      .limit(24);

    const { data: existingSpots } = await sb
      .from("trip_plan_spots")
      .select("name, slot_index, day:trip_plan_days(date)")
      .eq("plan_id", plan.id);

    const planSummary = plan.destination
      ? [
          `${plan.title} — ${plan.destination} (${plan.start_date} to ${plan.end_date})`,
          ...(existingSpots ?? []).map(
            (s) =>
              `${(s.day as { date: string } | null)?.date ?? "?"} #${s.slot_index}: ${s.name}`,
          ),
        ].join("\n")
      : null;

    const { runPlanner } = await import("./planner-ai.server");

    let result;
    try {
      result = await runPlanner({
        today: todayISO(),
        planSummary,
        history: (history ?? []).map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
      });
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      const message =
        status === 402
          ? "The planner is out of AI credits. Please try again later."
          : status === 429
            ? "The planner is busy right now. Try again in a moment."
            : "The planner could not answer that. Please try again.";
      throw new Error(message);
    }

    // ---- apply the model's plan/patch, treating its output as untrusted ----
    if (result.action === "generate" && result.tripPlan) {
      const tp = result.tripPlan;
      const range = datesBetween(tp.startDate, tp.endDate);
      if (range.length) {
        await sb.from("trip_plan_spots").delete().eq("plan_id", plan.id);
        await sb.from("trip_plan_days").delete().eq("plan_id", plan.id);

        await sb
          .from("trip_plans")
          .update({
            title: tp.title.slice(0, 90),
            destination: tp.destination.slice(0, 90),
            start_date: range[0]!,
            end_date: range[range.length - 1]!,
            hero_url: safeHero(tp.heroPhotoUrl),
            status: "ready",
          })
          .eq("id", plan.id);

        const { data: insertedDays } = await sb
          .from("trip_plan_days")
          .insert(
            range.map((date, i) => ({
              plan_id: plan.id,
              user_id: userId,
              date,
              sort_order: i,
            })),
          )
          .select("id, date");

        const dayByDate = new Map((insertedDays ?? []).map((d) => [d.date, d.id]));
        const rows = tp.spots
          .filter((s) => dayByDate.has(s.dayDate))
          .map((s) => ({
            plan_id: plan.id,
            user_id: userId,
            day_id: dayByDate.get(s.dayDate)!,
            name: s.name.slice(0, 120),
            spot_type: s.type,
            type_label: s.typeLabel?.slice(0, 60) ?? null,
            address: s.address?.slice(0, 200) ?? null,
            slot_index: s.slotIndex,
          }));
        if (rows.length) await sb.from("trip_plan_spots").insert(rows);
      }
    } else if (result.action === "patch" && result.patch) {
      const patch = result.patch;
      const range = datesBetween(plan.start_date ?? "", plan.end_date ?? "");

      for (const date of patch.addDayDates) {
        await sb
          .from("trip_plan_days")
          .upsert(
            { plan_id: plan.id, user_id: userId, date, sort_order: 0 },
            { onConflict: "plan_id,date" },
          );
      }
      if (patch.removeDayDates.length) {
        const { data: doomed } = await sb
          .from("trip_plan_days")
          .select("id")
          .eq("plan_id", plan.id)
          .in("date", patch.removeDayDates);
        for (const d of doomed ?? []) {
          await sb.from("trip_plan_spots").delete().eq("day_id", d.id);
          await sb.from("trip_plan_days").delete().eq("id", d.id);
        }
      }
      for (const name of patch.removeSpotNames) {
        await sb.from("trip_plan_spots").delete().eq("plan_id", plan.id).ilike("name", name);
      }
      if (patch.addSpots.length) {
        const { data: days } = await sb
          .from("trip_plan_days")
          .select("id, date")
          .eq("plan_id", plan.id);
        const dayByDate = new Map((days ?? []).map((d) => [d.date, d.id]));
        const rows = patch.addSpots
          .filter((s) => dayByDate.has(s.dayDate) && (!range.length || range.includes(s.dayDate)))
          .map((s) => ({
            plan_id: plan.id,
            user_id: userId,
            day_id: dayByDate.get(s.dayDate)!,
            name: s.name.slice(0, 120),
            spot_type: s.type,
            type_label: s.typeLabel?.slice(0, 60) ?? null,
            address: s.address?.slice(0, 200) ?? null,
            slot_index: s.slotIndex,
          }));
        if (rows.length) await sb.from("trip_plan_spots").insert(rows);
      }
    }

    await matchInventory(sb, plan.id);

    await sb.from("trip_plan_messages").insert({
      plan_id: plan.id,
      user_id: userId,
      role: "assistant",
      content: result.content,
      payload: { action: result.action },
    });

    return { limited: false as const, action: result.action };
  });

/** Link planned places to real Trips.bd inventory so the UI can offer a booking request. */
async function matchInventory(sb: Db, planId: string): Promise<void> {
  const { INVENTORY_LIVE } = await import("./inventory");
  if (!INVENTORY_LIVE) return;

  const { data: spots } = await sb
    .from("trip_plan_spots")
    .select("id, name, spot_type")
    .eq("plan_id", planId);

  for (const spot of spots ?? []) {
    if (spot.spot_type === "hotel") {
      const { data: listing } = await sb
        .from("listings")
        .select("id")
        .ilike("title", `%${spot.name}%`)
        .limit(1)
        .maybeSingle();
      if (listing) await sb.from("trip_plan_spots").update({ listing_id: listing.id }).eq("id", spot.id);
      continue;
    }
    const { data: activity } = await sb
      .from("activities")
      .select("id")
      .ilike("title", `%${spot.name}%`)
      .limit(1)
      .maybeSingle();
    if (activity) await sb.from("trip_plan_spots").update({ activity_id: activity.id }).eq("id", spot.id);
  }
}
