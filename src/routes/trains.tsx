import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/trains")({
  component: () => (
    <ComingSoon
      title="Trains"
      blurb="Bangladesh Railway seats are sold through the national ticketing system, so Trips.bd does not handle train requests at launch."
    />
  ),
  head: () => ({
    meta: [
      { title: "Trains — coming soon — Trips.bd" },
      {
        name: "description",
        content:
          "Train tickets are not yet available on Trips.bd. Browse stays, flights, activities and airport transfers instead.",
      },
      { property: "og:title", content: "Trains — coming soon — Trips.bd" },
      { property: "og:description", content: "Train tickets are not yet available on Trips.bd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
