import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved — Trips.bd" },
      { name: "description", content: "Your shortlisted hotels, homes and activities, saved for later on Trips.bd." },
      { property: "og:title", content: "Saved — Trips.bd" },
      { property: "og:description", content: "Shortlist places and come back when you are ready to book." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SavedPage() {
  return (
    <AppShell>
      <PageHeader title="Saved" subtitle="Your shortlist" />
      <EmptyState
        icon={<Heart size={34} />}
        title="Nothing saved yet"
        body="Tap the heart on any property to keep it here and track its price."
      />
    </AppShell>
  );
}
