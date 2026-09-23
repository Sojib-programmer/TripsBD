import { defineTool, ToolError } from "@lovable.dev/mcp-js";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_airport_directory",
  title: "Airport directory",
  description: "List airports Trips.bd serves, with IATA code, name, city and country.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("airports")
      .select("iata, name, city, country")
      .order("sort_order");
    if (error) throw new ToolError(error.message);
    const airports = (data ?? []).map((a) => ({
      iata: a.iata,
      name: a.name,
      city: a.city,
      country: a.country,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(airports) }],
      structuredContent: { airports },
    };
  },
});
