import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { hasOnboarded } from "@/lib/onboarding";
import { homeFeedQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(homeFeedQuery);
  },
  component: Index,
  head: () => ({
    meta: [
      { title: "Trips.bd — Hotels, Flights & Activities" },
      {
        name: "description",
        content:
          "Book hotels, flights, homes and activities with Trips.bd. Member deals, VIP status and request-to-book confirmation from your phone.",
      },
      { property: "og:title", content: "Trips.bd — Hotels, Flights & Activities" },
      {
        property: "og:description",
        content: "Book hotels, flights, homes and activities with Trips.bd.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasOnboarded()) void navigate({ to: "/welcome" });
  }, [navigate]);

  return (
    <div className="mx-auto max-w-[440px]">
      <AppShell>
        <HomeScreen />
      </AppShell>
    </div>
  );
}
