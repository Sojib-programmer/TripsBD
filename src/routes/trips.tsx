import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/trips")({
  component: TripsPage,
  head: () => ({
    meta: [
      { title: "My Trips — Trips.bd" },
      { name: "description", content: "View upcoming and past bookings, tickets and itineraries on Trips.bd." },
      { property: "og:title", content: "My Trips — Trips.bd" },
      { property: "og:description", content: "Upcoming and past bookings in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function TripsPage() {
  return (
    <AppShell>
      <PageHeader title="My Trips" subtitle="Bookings, tickets and itineraries" />
      <EmptyState
        icon={<Briefcase size={34} />}
        title="No trips yet"
        body="Once you book a hotel, flight or activity it will show up here with all your details."
      />
    </AppShell>
  );
}
