import { createFileRoute } from "@tanstack/react-router";

const spec = (origin: string, ref: string) => ({
  openapi: "3.1.0",
  info: {
    title: "Trips.bd Flight MCP",
    version: "0.1.0",
    description:
      "MCP Streamable HTTP endpoint (JSON-RPC 2.0). Methods: initialize, tools/list, tools/call. Tools: get_airport_directory, search_flights, create_flight_booking_request. Request-to-book only; no instant confirmation or payment.",
  },
  servers: [{ url: origin }],
  security: [{ supabaseOAuth: [] }],
  components: {
    securitySchemes: {
      supabaseOAuth: {
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: `https://${ref}.supabase.co/auth/v1/oauth/authorize`,
            tokenUrl: `https://${ref}.supabase.co/auth/v1/oauth/token`,
            scopes: {},
          },
        },
      },
    },
    schemas: {
      JsonRpcRequest: {
        type: "object",
        required: ["jsonrpc", "id", "method"],
        properties: {
          jsonrpc: { const: "2.0" },
          id: { type: ["string", "integer"] },
          method: { enum: ["initialize", "tools/list", "tools/call", "ping"] },
          params: { type: "object" },
        },
      },
    },
  },
  paths: {
    "/api/public/mcp": {
      post: {
        operationId: "mcpRpc",
        summary: "MCP JSON-RPC call",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/JsonRpcRequest" },
              example: {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/call",
                params: {
                  name: "search_flights",
                  arguments: { origin: "DAC", destination: "CXB", date: "2026-10-01", passengers: 2 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "JSON-RPC result (JSON or SSE)" },
          "401": { description: "Missing/invalid bearer token; see WWW-Authenticate" },
        },
      },
    },
  },
});

export const Route = createFileRoute("/api/public/openapi.json")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Response.json(
          spec(new URL(request.url).origin, import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? ""),
          { headers: { "cache-control": "public, max-age=300" } },
        ),
    },
  },
});
