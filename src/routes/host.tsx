import { createFileRoute } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { TallyForm } from "@/components/TallyForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/host")({
  component: HostPage,
  head: () => ({
    meta: [
      { title: "List your property — Trips.bd" },
      { name: "description", content: "Partner with Trips.bd: list your hotel, resort, home or villa and reach travellers across Bangladesh." },
      { property: "og:title", content: "List your property — Trips.bd" },
      { property: "og:description", content: "Become a Trips.bd host or partner property." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function HostPage() {
  const { user } = useAuth();
  return (
    <AppShell>
      <PageHeader title="Become a host" subtitle="List your property on Trips.bd" />
      <div className="px-2">
        <TallyForm form="host" title="Trips.bd host signup form" prefill={{ email: user?.email ?? undefined }} />
      </div>
    </AppShell>
  );
}
