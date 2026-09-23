import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { inventoryLive, supabaseForUser } from "../supabase";

const iata = z.string().trim().regex(/^[A-Za-z]{3}$/, "3-letter IATA code");

export default defineTool({
  name: "search_flights",
  title: "Search flights",
  description:
    "Search Trips.bd scheduled flights between two airports; fares in BDT per person. Results are reference timetables, not live availability.",
  inputSchema: {
    origin: iata.describe("Origin IATA code, e.g. DAC."),
    destination: iata.describe("Destination IATA code, e.g. CXB."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Departure date YYYY-MM-DD."),
    cabin: z.enum(["any", "economy", "premium", "business", "first"]).default("any"),
    passengers: z.number().int().min(1).max(9).default(1),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ origin, destination, date, cabin, passengers }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const from = origin.toUpperCase();
    const to = destination.toUpperCase();
    const bookingUrl = `https://app.trips.bd/flights?from=${from}&to=${to}&depart=${date}&adults=${passengers}`;
    if (!inventoryLive()) {
      return {
        content: [
          {
            type: "text",
            text: `No live fares for ${from}→${to}. Trips.bd works request-to-book: use create_flight_booking_request, or open ${bookingUrl}.`,
          },
        ],
        structuredContent: { live: false, flights: [], booking_url: bookingUrl },
      };
    }
    let q = supabaseForUser(ctx)
      .from("flights")
      .select(
        "id, airline, airline_code, flight_no, cabin, from_iata, to_iata, depart_time, arrive_time, duration_min, stops, fare_bdt, baggage_kg, cabin_baggage_kg, refundable",
      )
      .eq("from_iata", from)
      .eq("to_iata", to);
    if (cabin !== "any") q = q.eq("cabin", cabin);
    const { data, error } = await q.order("fare_bdt").limit(10);
    if (error) throw new ToolError(error.message);
    const flights = (data ?? []).map((f) => ({
      id: f.id,
      airline: f.airline,
      flight_no: f.flight_no,
      cabin: f.cabin,
      route: `${f.from_iata}-${f.to_iata}`,
      depart: f.depart_time,
      arrive: f.arrive_time,
      duration_min: f.duration_min,
      stops: f.stops,
      fare_bdt_per_person: f.fare_bdt,
      total_bdt: f.fare_bdt * passengers,
      baggage: { checked_kg: f.baggage_kg, cabin_kg: f.cabin_baggage_kg },
      refundable: f.refundable,
      booking_url: `https://app.trips.bd/book-flight?flightId=${f.id}&depart=${date}&adults=${passengers}&children=0`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(flights) }],
      structuredContent: { live: true, flights, booking_url: bookingUrl },
    };
  },
});
