import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Signal, Wifi } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { bdt, today } from "@/lib/format";
import { listEsimPlans } from "@/lib/verticals.functions";

export const Route = createFileRoute("/esim")({
  validateSearch: (s: Record<string, unknown>) => ({
    country: typeof s["country"] === "string" && s["country"] ? s["country"] : "all",
  }),
  component: EsimPage,
  head: () => ({
    meta: [
      { title: "Travel eSIM data plans — Trips.bd" },
      {
        name: "description",
        content:
          "Stay online abroad with instant eSIM data plans for Thailand, Malaysia, UAE, India and more. QR delivered by email, priced in BDT.",
      },
      { property: "og:title", content: "Travel eSIM plans — Trips.bd" },
      { property: "og:description", content: "Instant data abroad, no roaming bills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function EsimPage() {
  const { country } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const all = useQuery({ queryKey: ["esim", "all"], queryFn: () => listEsimPlans({ data: {} }) });
  const plans = (all.data ?? []).filter((p) => country === "all" || p.country === country);
  const picked = plans.find((p) => p.id === pickedId) ?? null;

  const chips = [
    { id: "all", label: "All" },
    ...[...new Set((all.data ?? []).map((p) => p.country))].map((c) => ({ id: c, label: c })),
  ];

  return (
    <AppShell>
      <VerticalHeader title="Travel eSIM" summary="Instant data, no roaming bills" />
      <ChipBar
        chips={chips}
        active={country}
        onSelect={(c) => void navigate({ to: "/esim", search: { country: c } })}
      />

      <section className="space-y-3 px-5 py-4">
        {all.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : plans.length ? (
          plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPickedId(p.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                picked?.id === p.id ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              <Wifi size={26} className="shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-foreground">
                  {p.country} · {p.is_unlimited ? "Unlimited" : `${p.data_gb} GB`}
                </p>
                <p className="text-[14px] text-muted-foreground">
                  {p.validity_days} days · {p.network}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
                  <Signal size={13} /> eSIM QR sent by email after confirmation
                </p>
              </div>
              <span className="text-[19px] font-bold text-foreground">{bdt(p.price_bdt)}</span>
            </button>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No plans for that destination yet.
          </p>
        )}
      </section>

      {picked ? (
        <section className="border-t border-border px-5 py-4">
          <CheckoutPanel
            draft={{
              vertical: "esim",
              itemId: picked.id,
              title: `${picked.country} eSIM · ${picked.is_unlimited ? "Unlimited" : `${picked.data_gb} GB`}`,
              subtitle: `${picked.validity_days} days on ${picked.network}`,
              startsAt: `${today()}T00:00:00+06:00`,
              travellers: 1,
              totalBdt: picked.price_bdt,
              details: {
                country: picked.country,
                dataGb: picked.data_gb,
                days: picked.validity_days,
                network: picked.network,
              },
            }}
            breakdown={[
              { label: "Destination", value: picked.country },
              {
                label: "Data",
                value: picked.is_unlimited ? "Unlimited" : `${picked.data_gb} GB`,
              },
              { label: "Validity", value: `${picked.validity_days} days` },
            ]}
            cta="Get eSIM"
          />
        </section>
      ) : null}
    </AppShell>
  );
}
