import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/packages")({
  component: () => (
    <ComingSoon
      title="Flight + Hotel"
      blurb="Bundled flight and hotel packages are not part of the Trips.bd launch scope. You can request a flight and a stay separately today."
    />
  ),
  head: () => ({
    meta: [
      { title: "Flight + Hotel packages — coming soon — Trips.bd" },
      {
        name: "description",
        content:
          "Bundled packages are not yet available on Trips.bd. Request flights and stays separately instead.",
      },
      { property: "og:title", content: "Flight + Hotel packages — coming soon — Trips.bd" },
      {
        property: "og:description",
        content: "Bundled packages are not yet available on Trips.bd.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
