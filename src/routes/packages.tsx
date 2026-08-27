import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plane, Sparkles } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, Sheet } from "@/components/search/Sheet";
import { Stepper } from "@/components/search/Stepper";
import { VerticalHeader } from "@/components/VerticalHeader";
import { addDays, bdt, prettyDate, today } from "@/lib/format";
import { listPackages } from "@/lib/verticals.functions";

export const Route = createFileRoute("/packages")({
  validateSearch: (s: Record<string, unknown>) => ({
    depart: typeof s["depart"] === "string" && s["depart"] ? s["depart"] : today(),
    pax: Number(s["pax"] ?? 2) || 2,
  }),
  component: PackagesPage,
  head: () => ({
    meta: [
      { title: "Flight + Hotel bundles — Trips.bd" },
      {
        name: "description",
        content:
          "Save by bundling flights and stays: Dhaka to Cox's Bazar, Sylhet and Chattogram packages with one request-to-book flow.",
      },
      { property: "og:title", content: "Flight + Hotel bundles — Trips.bd" },
      { property: "og:description", content: "Bundle and save on flights plus stays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PackagesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const [openCal, setOpenCal] = useState(false);
  const [depart, setDepart] = useState(search.depart);
  const [pax, setPax] = useState(search.pax);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["packages"], queryFn: () => listPackages() });
  const list = q.data ?? [];
  const picked = list.find((p) => p.id === pickedId) ?? null;

  return (
    <AppShell>
      <VerticalHeader
        title="Flight + Hotel"
        summary={`${prettyDate(search.depart)} · ${search.pax} travellers`}
        onEdit={() => setOpen(true)}
      />

      <section className="space-y-4 px-5 py-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : list.length ? (
          list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPickedId(p.id)}
              className={`block w-full overflow-hidden rounded-2xl border text-left ${
                picked?.id === p.id ? "border-brand" : "border-border"
              }`}
            >
              {p.hero_url ? (
                <img
                  src={p.hero_url}
                  alt={p.title}
                  loading="lazy"
                  className="h-[170px] w-full object-cover"
                />
              ) : null}
              <div className="p-4">
                <p className="flex items-center gap-1 text-[13px] uppercase tracking-wide text-brand">
                  <Plane size={14} /> {p.from_iata} → {p.to_iata} · {p.nights} nights
                </p>
                <p className="mt-1 text-[17px] font-semibold text-foreground">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-[15px] text-muted-foreground">{p.summary}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-[22px] font-bold text-foreground">
                    {bdt(p.bundle_price_bdt)}
                  </span>
                  <span className="text-[15px] text-muted-foreground line-through">
                    {bdt(p.separate_price_bdt)}
                  </span>
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[13px] font-semibold text-brand">
                    <Sparkles size={13} /> save {p.saving_pct}%
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No bundles right now.
          </p>
        )}
      </section>

      {picked ? (
        <section className="border-t border-border px-5 py-4">
          <CheckoutPanel
            draft={{
              vertical: "package",
              itemId: picked.id,
              title: picked.title,
              subtitle: `${picked.from_iata} → ${picked.to_iata} · ${picked.nights} nights`,
              ...(picked.hero_url ? { heroUrl: picked.hero_url } : {}),
              startsAt: `${search.depart}T08:00:00+06:00`,
              endsAt: `${addDays(search.depart, picked.nights)}T12:00:00+06:00`,
              travellers: search.pax,
              totalBdt: picked.bundle_price_bdt * search.pax,
              details: {
                from: picked.from_iata,
                to: picked.to_iata,
                nights: picked.nights,
                slug: picked.slug,
              },
            }}
            breakdown={[
              { label: "Depart", value: prettyDate(search.depart) },
              { label: "Return", value: prettyDate(addDays(search.depart, picked.nights)) },
              {
                label: `${bdt(picked.bundle_price_bdt)} × ${search.pax}`,
                value: bdt(picked.bundle_price_bdt * search.pax),
              },
            ]}
            cta="Request bundle"
          />
        </section>
      ) : null}

      <Sheet
        open={open}
        title="Flight + Hotel"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void navigate({ to: "/packages", search: () => ({ depart, pax }) });
            }}
            className="w-full rounded-full bg-brand py-3.5 text-[17px] font-semibold text-brand-foreground"
          >
            Search
          </button>
        }
      >
        <FieldRow label="Departure date">
          <button
            type="button"
            onClick={() => setOpenCal((v) => !v)}
            className="w-full rounded-xl border border-border px-4 py-3 text-left text-[16px] text-foreground"
          >
            {prettyDate(depart)}
          </button>
        </FieldRow>
        {openCal ? (
          <DateRangeCalendar
            single
            start={depart}
            onChange={(s) => {
              setDepart(s);
              setOpenCal(false);
            }}
          />
        ) : null}
        <Stepper label="Travellers" value={pax} min={1} max={9} onChange={setPax} />
      </Sheet>
    </AppShell>
  );
}
