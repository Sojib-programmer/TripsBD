import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Loader2, Users } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, inputClass, Sheet } from "@/components/search/Sheet";
import { Stepper } from "@/components/search/Stepper";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { bdt, prettyDate, today } from "@/lib/format";
import { listAirports, listTransfers } from "@/lib/verticals.functions";

export const Route = createFileRoute("/transfers")({
  validateSearch: (s: Record<string, unknown>) => ({
    airport: typeof s["airport"] === "string" && s["airport"] ? s["airport"] : "DAC",
    direction: typeof s["direction"] === "string" ? s["direction"] : "arrival",
    date: typeof s["date"] === "string" && s["date"] ? s["date"] : today(),
    time: typeof s["time"] === "string" && s["time"] ? s["time"] : "10:00",
    pax: Number(s["pax"] ?? 2) || 2,
  }),
  component: TransfersPage,
  head: () => ({
    meta: [
      { title: "Airport transfers in Bangladesh — Trips.bd" },
      {
        name: "description",
        content:
          "Fixed-price airport pickups and drop-offs at Dhaka, Chattogram, Sylhet and Cox's Bazar. Meet-and-greet, luggage included, paid in BDT.",
      },
      { property: "og:title", content: "Airport transfers — Trips.bd" },
      { property: "og:description", content: "Fixed-price rides to and from the airport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const directions = [
  { id: "arrival", label: "From airport" },
  { id: "departure", label: "To airport" },
];

function TransfersPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [airport, setAirport] = useState(search.airport);
  const [date, setDate] = useState(search.date);
  const [time, setTime] = useState(search.time);
  const [pax, setPax] = useState(search.pax);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const airports = useQuery({ queryKey: ["airports"], queryFn: () => listAirports() });
  const rows = useQuery({
    queryKey: ["transfers", search.airport],
    queryFn: () => listTransfers({ data: { airport: search.airport } }),
  });

  const list = (rows.data ?? []).filter((t) => t.seats >= search.pax);
  const picked = list.find((t) => t.id === pickedId) ?? null;
  const airportName =
    airports.data?.find((a) => a.iata === search.airport)?.city ?? search.airport;

  return (
    <AppShell>
      <VerticalHeader
        title={`${search.airport} · ${search.pax} passengers`}
        summary={`${prettyDate(search.date)} · ${search.time}`}
        onEdit={() => setOpen(true)}
      />
      <ChipBar
        chips={directions}
        active={search.direction}
        onSelect={(d) => void navigate({ to: "/transfers", search: (p) => ({ ...p, direction: d }) })}
      />

      <section className="space-y-3 px-5 py-4">
        {rows.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : list.length ? (
          list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPickedId(t.id)}
              className={`flex w-full gap-3 rounded-2xl border p-4 text-left ${
                picked?.id === t.id ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              {t.photo_url ? (
                <img
                  src={t.photo_url}
                  alt={t.vehicle_class}
                  loading="lazy"
                  className="h-[64px] w-[84px] shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-foreground">{t.vehicle_class}</p>
                <p className="truncate text-[14px] text-muted-foreground">
                  {t.vehicle_example ?? "or similar"} · {t.area}
                </p>
                <div className="mt-1 flex gap-3 text-[14px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {t.seats}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} /> {t.luggage}
                  </span>
                </div>
              </div>
              <span className="self-center text-[19px] font-bold text-foreground">
                {bdt(t.price_bdt)}
              </span>
            </button>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No vehicles for that airport and party size.
          </p>
        )}
      </section>

      {picked ? (
        <section className="border-t border-border px-5 py-4">
          <CheckoutPanel
            draft={{
              vertical: "transfer",
              itemId: picked.id,
              title: `${picked.vehicle_class} transfer · ${airportName}`,
              subtitle: `${search.direction === "arrival" ? "From" : "To"} ${search.airport} · ${picked.area}`,
              ...(picked.photo_url ? { heroUrl: picked.photo_url } : {}),
              startsAt: `${search.date}T${search.time}:00+06:00`,
              travellers: search.pax,
              totalBdt: picked.price_bdt,
              details: {
                direction: search.direction,
                airport: search.airport,
                area: picked.area,
                time: search.time,
              },
            }}
            breakdown={[
              { label: "Vehicle", value: picked.vehicle_class },
              { label: "Pickup", value: `${prettyDate(search.date)} ${search.time}` },
              { label: "Fixed fare", value: bdt(picked.price_bdt) },
            ]}
            cta="Request transfer"
          />
        </section>
      ) : null}

      <Sheet
        open={open}
        title="Airport transfer"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void navigate({
                to: "/transfers",
                search: (p) => ({ ...p, airport, date, time, pax }),
              });
            }}
            className="w-full rounded-full bg-brand py-3.5 text-[17px] font-semibold text-brand-foreground"
          >
            Search
          </button>
        }
      >
        <FieldRow label="Airport">
          <select
            value={airport}
            onChange={(e) => setAirport(e.target.value)}
            className={inputClass}
          >
            {(airports.data ?? []).map((a) => (
              <option key={a.iata} value={a.iata}>
                {a.city} ({a.iata}) — {a.name}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Date">
          <button
            type="button"
            onClick={() => setOpenDate((v) => !v)}
            className="w-full rounded-xl border border-border px-4 py-3 text-left text-[16px] text-foreground"
          >
            {prettyDate(date)}
          </button>
        </FieldRow>
        {openDate ? (
          <DateRangeCalendar
            single
            start={date}
            onChange={(s) => {
              setDate(s);
              setOpenDate(false);
            }}
          />
        ) : null}
        <FieldRow label="Pickup time">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </FieldRow>
        <Stepper label="Passengers" value={pax} min={1} max={12} onChange={setPax} />
      </Sheet>
    </AppShell>
  );
}
