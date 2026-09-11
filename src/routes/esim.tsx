import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/esim")({
  component: () => (
    <ComingSoon
      title="Travel eSIM"
      blurb="Data eSIM plans are not part of the Trips.bd launch scope."
    />
  ),
  head: () => ({
    meta: [
      { title: "Travel eSIM — coming soon — Trips.bd" },
      {
        name: "description",
        content:
          "Travel eSIM plans are not yet available on Trips.bd. Browse stays, flights, activities and airport transfers instead.",
      },
      { property: "og:title", content: "Travel eSIM — coming soon — Trips.bd" },
      { property: "og:description", content: "eSIM plans are not yet available on Trips.bd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
