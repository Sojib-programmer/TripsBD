import { createFileRoute } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { TallyForm } from "@/components/TallyForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support & Feedback — Trips.bd" },
      { name: "description", content: "Contact Trips.bd support about a booking, payment, refund or account issue, or send product feedback." },
      { property: "og:title", content: "Support & Feedback — Trips.bd" },
      { property: "og:description", content: "Get help with bookings, payments and your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SupportPage() {
  const { user } = useAuth();
  return (
    <AppShell>
      <PageHeader title="Support" subtitle="We reply within one business day" />
      <div className="px-2">
        <TallyForm form="support" title="Trips.bd support form" prefill={{ email: user?.email ?? undefined }} />
      </div>
    </AppShell>
  );
}
