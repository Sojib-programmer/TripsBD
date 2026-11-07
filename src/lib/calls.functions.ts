import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStaff } from "@/lib/ops.functions";

type Ctx = Parameters<typeof isStaff>[0];

/** A call room is a booking/order reference. Only its owner or staff may join. */
async function authorizeRoom(ctx: Ctx, room: string) {
  if (await isStaff(ctx)) return { role: "staff" as const };
  const [b, o] = await Promise.all([
    ctx.supabase
      .from("bookings")
      .select("id")
      .eq("reference", room)
      .eq("user_id", ctx.userId)
      .maybeSingle(),
    ctx.supabase
      .from("orders")
      .select("id")
      .eq("reference", room)
      .eq("user_id", ctx.userId)
      .maybeSingle(),
  ]);
  if (!b.data && !o.data) throw new Error("You can't join this call.");
  return { role: "traveller" as const };
}

const room = z
  .string()
  .trim()
  .regex(/^[A-Z0-9-]{4,40}$/);
const sdp = z.string().min(10).max(20000);
const id = z.string().regex(/^[A-Za-z0-9_-]{8,128}$/);

export const joinCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ room }).parse(d))
  .handler(async ({ data, context }) => {
    const { role } = await authorizeRoom(context, data.room);
    const { cf } = await import("./calls.server");
    const s = await cf<{ sessionId: string }>("POST", "/sessions/new");
    return { sessionId: s.sessionId, role };
  });

export const callStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { callsConfigured } = await import("./calls.server");
  return { enabled: callsConfigured() };
});

export const pushTracks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        room,
        sessionId: id,
        sdp,
        tracks: z
          .array(z.object({ mid: z.string().max(10), trackName: id }))
          .min(1)
          .max(4),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await authorizeRoom(context, data.room);
    const { cf } = await import("./calls.server");
    const r = await cf<{ sessionDescription: { sdp: string; type: string } }>(
      "POST",
      `/sessions/${data.sessionId}/tracks/new`,
      {
        sessionDescription: { type: "offer", sdp: data.sdp },
        tracks: data.tracks.map((t) => ({ location: "local", ...t })),
      },
    );
    return { sdp: r.sessionDescription.sdp };
  });

export const pullTracks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ room, sessionId: id, remoteSessionId: id, trackNames: z.array(id).min(1).max(4) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await authorizeRoom(context, data.room);
    const { cf } = await import("./calls.server");
    const r = await cf<{
      sessionDescription?: { sdp: string; type: string };
      requiresImmediateRenegotiation?: boolean;
    }>("POST", `/sessions/${data.sessionId}/tracks/new`, {
      tracks: data.trackNames.map((trackName) => ({
        location: "remote",
        sessionId: data.remoteSessionId,
        trackName,
      })),
    });
    return {
      sdp: r.sessionDescription?.sdp ?? null,
      renegotiate: !!r.requiresImmediateRenegotiation,
    };
  });

export const renegotiate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ room, sessionId: id, sdp }).parse(d))
  .handler(async ({ data, context }) => {
    await authorizeRoom(context, data.room);
    const { cf } = await import("./calls.server");
    await cf("PUT", `/sessions/${data.sessionId}/renegotiate`, {
      sessionDescription: { type: "answer", sdp: data.sdp },
    });
    return { ok: true };
  });
