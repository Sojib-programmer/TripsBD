import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

const iata = z.string().trim().regex(/^[A-Za-z]{3}$/);

export default defineTool({
  name: "create_flight_booking_request",
  title: "Request a flight booking",
  description:
    "Create a flight booking request on the signed-in user's Trips.bd account. Not a confirmed ticket: the Trips.bd team sources and confirms it manually.",
  inputSchema: {
    origin: iata,
    destination: iata,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    passengers: z.number().int().min(1).max(9).default(1),
    cabin: z.enum(["any", "economy", "premium", "business", "first"]).default("any"),
    contact_name: z.string().trim().min(2).max(100),
    contact_phone: z.string().trim().max(30).optional(),
    notes: z.string().trim().max(500).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async (a, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const email = ctx.getUserEmail();
    if (!email) throw new ToolError("Account has no email address");
    const from = a.origin.toUpperCase();
    const to = a.destination.toUpperCase();
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .insert({
        user_id: ctx.getUserId()!,
        vertical: "flight",
        title: `Flight ${from} → ${to}`,
        subtitle: a.return_date ? `Return ${a.return_date}` : "One-way",
        starts_at: a.date,
        ends_at: a.return_date ?? null,
        travellers: a.passengers,
        total_bdt: 0,
        contact_name: a.contact_name,
        contact_email: email,
        contact_phone: a.contact_phone ?? null,
        details: { from, to, cabin: a.cabin, notes: a.notes ?? null, source: "mcp" },
      })
      .select("reference, status")
      .single();
    if (error) throw new ToolError(error.message);
    const url = `https://app.trips.bd/order/${data.reference}`;
    return {
      content: [
        {
          type: "text",
          text: `Request ${data.reference} submitted (status: ${data.status}). Not yet confirmed; track at ${url}.`,
        },
      ],
      structuredContent: { reference: data.reference, status: data.status, order_url: url },
    };
  },
});
