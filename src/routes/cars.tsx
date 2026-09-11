import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/cars")({
  component: () => (
    <ComingSoon
      title="Car rentals"
      blurb="Self-drive and chauffeur car rental is not part of the Trips.bd launch scope."
    />
  ),
  head: () => ({
    meta: [
      { title: "Car rentals — coming soon — Trips.bd" },
      {
        name: "description",
        content:
          "Car rental is not yet available on Trips.bd. Browse stays, flights, activities and airport transfers instead.",
      },
      { property: "og:title", content: "Car rentals — coming soon — Trips.bd" },
      { property: "og:description", content: "Car rental is not yet available on Trips.bd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
