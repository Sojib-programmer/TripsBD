import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { toast } from "sonner";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { dealsQuery } from "@/lib/queries";

export const Route = createFileRoute("/deals")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(dealsQuery);
  },
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

function DealsPage() {
  const { data: deals } = useSuspenseQuery(dealsQuery);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copied`);
    } catch {
      toast.error("Could not copy the code");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Deals" subtitle="Member prices, refreshed daily" />
      {deals.length === 0 ? (
        <EmptyState
          icon={<Ticket size={34} />}
          title="No live deals"
          body="New member offers land here every week. Check back soon."
        />
      ) : (
        <ul className="space-y-3 px-5">
          {deals.map((deal) => (
            <li key={deal.id} className="flex gap-3 rounded-2xl border border-border p-4">
              <Ticket size={28} className="mt-1 shrink-0 text-dot-amber" />
              <div className="min-w-0">
                <p className="text-[17px] font-semibold text-foreground">{deal.title}</p>
                <p className="text-[15px] text-muted-foreground">{deal.subtitle}</p>
                {deal.terms ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">{deal.terms}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void copy(deal.code)}
                  className="mt-2 inline-block rounded-md bg-muted px-2 py-1 text-[13px] font-medium tracking-wide text-foreground"
                >
                  {deal.code} · tap to copy
                </button>
              </div>
              <span className="ml-auto shrink-0 self-start text-[15px] font-semibold text-brand">
                -{deal.discount_pct}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
