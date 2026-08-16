import { createFileRoute } from "@tanstack/react-router";
import { Ticket, Star, Percent } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
  head: () => ({
    meta: [
      { title: "Deals & Promotions — Trips.bd" },
      { name: "description", content: "Member-only discounts on hotels, flights and activities across Bangladesh and beyond." },
      { property: "og:title", content: "Deals & Promotions — Trips.bd" },
      { property: "og:description", content: "Member-only travel discounts, updated daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const deals = [
  { icon: Ticket, title: "Up to 8% off", body: "On your first hotel booking", code: "FIRST8" },
  { icon: Star, title: "VIP Gold trial", body: "Unlock up to 18% off for 30 days", code: "GOLD30" },
  { icon: Percent, title: "Flight + Hotel", body: "Bundle and save an extra 12%", code: "BUNDLE12" },
];

function DealsPage() {
  return (
    <AppShell>
      <PageHeader title="Deals" subtitle="Member prices, refreshed daily" />
      <ul className="space-y-3 px-5">
        {deals.map(({ icon: Icon, title, body, code }) => (
          <li key={code} className="flex gap-3 rounded-2xl border border-border p-4">
            <Icon size={28} className="mt-1 shrink-0 text-dot-amber" />
            <div>
              <p className="text-[17px] font-semibold text-foreground">{title}</p>
              <p className="text-[15px] text-muted-foreground">{body}</p>
              <p className="mt-2 inline-block rounded-md bg-muted px-2 py-1 text-[13px] font-medium tracking-wide text-foreground">
                {code}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
