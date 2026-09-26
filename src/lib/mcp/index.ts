import { auth, defineMcp } from "@lovable.dev/mcp-js";

import airports from "./tools/airports";
import requestFlight from "./tools/request-flight";
import searchFlights from "./tools/search-flights";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

// Google OAuth client ID is a public identifier, so it ships as a VITE_ var.
// When set, MCP clients authenticate with Google (OIDC) instead of Supabase.
// Note: Google must issue a JWT to the client (an OIDC ID token) — opaque
// Google access tokens cannot be verified against a JWKS.
const googleClientId = import.meta.env["VITE_GOOGLE_OAUTH_CLIENT_ID"] ?? "";

const googleAuth = auth.oauth.issuer({
  issuer: "https://accounts.google.com",
  acceptedAudiences: googleClientId,
  jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  requiredScopes: ["openid", "email"],
  resourceName: "Trips.bd flight tools",
});

const supabaseAuth = auth.oauth.issuer({
  issuer: `https://${projectRef}.supabase.co/auth/v1`,
  acceptedAudiences: "authenticated",
});

export default defineMcp({
  name: "app-trips-bd",
  title: "app trips bd",
  version: "0.1.0",
  instructions:
    "Trips.bd flight tools for Bangladesh travel. Use get_airport_directory to resolve cities to IATA codes, search_flights for reference timetables in BDT, and create_flight_booking_request to submit a request-to-book (human-confirmed, never instant).",
  auth: googleClientId ? googleAuth : supabaseAuth,
  tools: [airports, searchFlights, requestFlight],
});
