import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, TrainFront } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, inputClass, Sheet } from "@/components/search/Sheet";
import { Stepper } from "@/components/search/Stepper";
import { VerticalHeader } from "@/components/VerticalHeader";
import { arrivalDayOffset, bdt, duration, hhmm, prettyDate, today } from "@/lib/format";
import { listTrainCities, listTrains } from "@/lib/verticals.functions";

export const Route = createFileRoute("/trains")({
  validateSearch: (s: Record<string, unknown>) => ({
    from: typeof s["from"] === "string" && s["from"] ? s["from"] : "Dhaka",
    to: typeof s["to"] === "string" && s["to"] ? s["to"] : "all",
    date: typeof s["date"] === "string" && s["date"] ? s["date"] : today(),
    pax: Number(s["pax"] ?? 1) || 1,
  }),
  component: TrainsPage,
  head: () => ({
    meta: [
      { title: "Bangladesh Railway tickets — Trips.bd" },
      {
        name: "description",
        content:
          "Intercity train times and fares from Dhaka to Chattogram, Sylhet, Rajshahi and Khulna. Shovan Chair to Snigdha, priced in BDT.",
      },
      { property: "og:title", content: "Train tickets — Trips.bd" },
      { property: "og:description", content: "Intercity schedules and fares across Bangladesh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function TrainsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const [openCal, setOpenCal] = useState(false);
  const [from, setFrom] = useState(search.from);
  const [to, setTo] = useState(search.to);
  const [date, setDate] = useState(search.date);
  const [pax, setPax] = useState(search.pax);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const cities = useQuery({ queryKey: ["train-cities"], queryFn: () => listTrainCities() });
  const q = useQuery({
    queryKey: ["trains", search.from, search.to],
    queryFn: () => listTrains({ data: { from: search.from, to: search.to } }),
  });

  const list = q.data ?? [];
  const picked = list.find((t) => t.id === pickedId) ?? null;

  return (
    <AppShell>
      <VerticalHeader
        title={`${search.from} → ${search.to === "all" ? "Anywhere" : search.to}`}
        summary={`${prettyDate(search.date)} · ${search.pax} passengers`}
        onEdit={() => setOpen(true)}
      />

      <section className="space-y-3 px-5 py-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : list.length ? (
          list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPickedId(t.id)}
              className={`w-full rounded-2xl border p-4 text-left ${
                picked?.id === t.id ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <TrainFront size={14} className="text-brand" />
                {t.train_name} ({t.train_no}) · {t.operator}
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-[20px] font-bold text-foreground">
                    {hhmm(t.depart_time)} → {hhmm(t.arrive_time)}
                    {arrivalDayOffset(t.depart_time, t.arrive_time) ? (
                      <sup className="ml-1 text-[12px] text-brand">+1</sup>
                    ) : null}
                  </p>
                  <p className="text-[14px] text-muted-foreground">
                    {t.from_city} → {t.to_city} · {duration(t.duration_min)} · {t.travel_class}
                    {t.off_day ? ` · off ${t.off_day}` : ""}
                  </p>
                </div>
                <span className="text-[19px] font-bold text-foreground">{bdt(t.price_bdt)}</span>
              </div>
            </button>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No trains on that route.
          </p>
        )}
      </section>

      {picked ? (
        <section className="border-t border-border px-5 py-4">
          <CheckoutPanel
            draft={{
              vertical: "train",
              itemId: picked.id,
              title: `${picked.train_name} · ${picked.from_city} → ${picked.to_city}`,
              subtitle: `${picked.travel_class} · ${hhmm(picked.depart_time)}`,
              startsAt: `${search.date}T${picked.depart_time}+06:00`,
              travellers: search.pax,
              totalBdt: picked.price_bdt * search.pax,
              details: {
                trainNo: picked.train_no,
                class: picked.travel_class,
                from: picked.from_city,
                to: picked.to_city,
              },
            }}
            breakdown={[
              { label: "Date", value: prettyDate(search.date) },
              { label: "Class", value: picked.travel_class },
              {
                label: `${bdt(picked.price_bdt)} × ${search.pax}`,
                value: bdt(picked.price_bdt * search.pax),
              },
            ]}
            cta="Request tickets"
          />
        </section>
      ) : null}

      <Sheet
        open={open}
        title="Train tickets"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void navigate({ to: "/trains", search: (p) => ({ ...p, from, to, date, pax }) });
            }}
            className="w-full rounded-full bg-brand py-3.5 text-[17px] font-semibold text-brand-foreground"
          >
            Search
          </button>
        }
      >
        <FieldRow label="From">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
            {(cities.data?.from ?? [from]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="To">
          <select value={to} onChange={(e) => setTo(e.target.value)} className={inputClass}>
            <option value="all">Anywhere</option>
            {(cities.data?.to ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Date">
          <button
            type="button"
            onClick={() => setOpenCal((v) => !v)}
            className="w-full rounded-xl border border-border px-4 py-3 text-left text-[16px] text-foreground"
          >
            {prettyDate(date)}
          </button>
        </FieldRow>
        {openCal ? (
          <DateRangeCalendar
            single
            start={date}
            onChange={(s) => {
              setDate(s);
              setOpenCal(false);
            }}
          />
        ) : null}
        <Stepper label="Passengers" value={pax} min={1} max={8} onChange={setPax} />
      </Sheet>
    </AppShell>
  );
}
