import { createFileRoute, redirect } from "@tanstack/react-router";

import { addDays, today } from "@/lib/format";

/** Legacy entry point — keeps old links working by forwarding to /stays. */
export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    guests: Number(s["guests"] ?? 2) || 2,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/stays",
      search: {
        q: search.q,
        kind: "all",
        checkIn: today(),
        checkOut: addDays(today(), 2),
        rooms: 1,
        adults: search.guests,
        children: 0,
        sort: "recommended",
      },
    });
  },
});
