import { auth, defineMcp } from "@lovable.dev/mcp-js";

import airports from "./tools/airports";
import requestFlight from "./tools/request-flight";
import searchFlights from "./tools/search-flights";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "app-trips-bd",
  title: "app trips bd",
  version: "0.1.0",
  instructions:
    "Trips.bd flight tools for Bangladesh travel. Use get_airport_directory to resolve cities to IATA codes, search_flights for reference timetables in BDT, and create_flight_booking_request to submit a request-to-book (human-confirmed, never instant).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [airports, searchFlights, requestFlight],
});
