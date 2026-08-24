import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Loader2, Plane } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, inputClass, Sheet } from "@/components/search/Sheet";
import { Stepper } from "@/components/search/Stepper";
import { arrivalDayOffset, bdt, duration, hhmm, prettyDate, today } from "@/lib/format";
import { listAirports, searchFlights } from "@/lib/verticals.functions";

type FlightSearch = {
  from: string;
  to: string;
  depart: string;
  ret: string;
  trip: string;
  adults: number;
  children: number;
  cabin: string;
  sort: string;
};

export const Route = createFileRoute("/flights")({
  validateSearch: (s: Record<string, unknown>): FlightSearch => ({
    from: typeof s["from"] === "string" && s["from"] ? s["from"] : "DAC",
    to: typeof s["to"] === "string" && s["to"] ? s["to"] : "CXB",
    depart: typeof s["depart"] === "string" && s["depart"] ? s["depart"] : today(),
    ret: typeof s["ret"] === "string" ? s["ret"] : "",
    trip: typeof s["trip"] === "string" ? s["trip"] : "oneway",
    adults: Number(s["adults"] ?? 1) || 1,
    children: Number(s["children"] ?? 0) || 0,
    cabin: typeof s["cabin"] === "string" ? s["cabin"] : "any",
    sort: typeof s["sort"] === "string" ? s["sort"] : "cheapest",
  }),
  component: FlightsPage,
  head: () => ({
    meta: [
      { title: "Flights from Dhaka — Trips.bd" },
      {
        name: "description",
        content:
          "Compare domestic and international fares from Dhaka: Biman, US-Bangla, Novoair, Air Astra, Emirates and more. Times in Dhaka time, prices in BDT.",
      },
      { property: "og:title", content: "Flights from Dhaka — Trips.bd" },
      { property: "og:description", content: "Compare fares and book in a few taps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const sortChips = [
  { id: "cheapest", label: "Cheapest" },
  { id: "fastest", label: "Fastest" },
  { id: "earliest", label: "Earliest" },
];

const cabins = [
  { id: "any", label: "Any cabin" },
  { id: "economy", label: "Economy" },
  { id: "business", label: "Business" },
];

function FlightsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);

  const [from, setFrom] = useState(search.from);
  const [to, setTo] = useState(search.to);
  const [depart, setDepart] = useState(search.depart);
  const [ret, setRet] = useState(search.ret);
  const [trip, setTrip] = useState(search.trip);
  const [adults, setAdults] = useState(search.adults);
  const [kids, setKids] = useState(search.children);
  const [cabin, setCabin] = useState(search.cabin);

  const airports = useQuery({ queryKey: ["airports"], queryFn: () => listAirports() });
  const flights = useQuery({
    queryKey: ["flights", search.from, search.to, search.cabin],
    queryFn: () =>
      searchFlights({ data: { from: search.from, to: search.to, cabin: search.cabin } }),
  });

  const pax = search.adults + search.children;
  const rows = [...(flights.data ?? [])].sort((a, b) => {
    if (search.sort === "fastest") return a.duration_min - b.duration_min;
    if (search.sort === "earliest") return a.depart_time.localeCompare(b.depart_time);
    return a.fare_bdt - b.fare_bdt;
  });
  const cheapest = rows.length ? Math.min(...rows.map((r) => r.fare_bdt)) : 0;
  const quickest = rows.length ? Math.min(...rows.map((r) => r.duration_min)) : 0;

  const apply = () => {
    void navigate({
      to: "/flights",
      search: {
        ...search,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        depart,
        ret: trip === "return" ? ret : "",
        trip,
        adults,
        children: kids,
        cabin,
      },
    });
    setOpen(false);
  };

  return (
    <AppShell>
      <VerticalHeader
        title={`${search.from} → ${search.to}`}
        summary={`${prettyDate(search.depart)}${
          search.trip === "return" && search.ret ? ` – ${prettyDate(search.ret)}` : ""
        } · ${pax} traveller${pax > 1 ? "s" : ""} · ${
          cabins.find((c) => c.id === search.cabin)?.label ?? "Any cabin"
        }`}
        onEdit={() => setOpen(true)}
      />

      <ChipBar
        chips={sortChips}
        active={search.sort}
        onSelect={(sort) => void navigate({ to: "/flights", search: { ...search, sort } })}
      />

      <section className="px-4 py-4">
        {flights.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : rows.length ? (
          <ul className="space-y-3">
            {rows.map((f) => {
              const offset = arrivalDayOffset(f.depart_time, f.arrive_time);
              return (
                <li key={f.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-[13px] font-bold text-brand">
                        {f.airline_code}
                      </span>
                      <div>
                        <p className="text-[15px] font-medium text-foreground">{f.airline}</p>
                        <p className="text-[13px] text-muted-foreground">
                          {f.flight_no} · {f.cabin}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {f.fare_bdt === cheapest ? (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[12px] font-semibold text-brand">
                          Cheapest
                        </span>
                      ) : null}
                      {f.duration_min === quickest ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-foreground">
                          Fastest
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-[20px] font-semibold text-foreground">
                        {hhmm(f.depart_time)}
                      </p>
                      <p className="text-[13px] text-muted-foreground">{f.from_iata}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[12px] text-muted-foreground">
                        {duration(f.duration_min)}
                      </p>
                      <div className="my-1 h-px bg-border" />
                      <p className="text-[12px] text-muted-foreground">
                        {f.stops === 0 ? "Direct" : `${f.stops} stop`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-semibold text-foreground">
                        {hhmm(f.arrive_time)}
                        {offset ? <sup className="text-[12px] text-dot-red"> +1</sup> : null}
                      </p>
                      <p className="text-[13px] text-muted-foreground">{f.to_iata}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
                    <div>
                      <p className="text-[13px] text-muted-foreground">
                        {f.baggage_kg}kg checked · {f.cabin_baggage_kg}kg cabin
                        {f.refundable ? " · refundable" : ""}
                      </p>
                      <p className="text-[22px] font-bold text-foreground">
                        {bdt(f.fare_bdt * pax)}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {bdt(f.fare_bdt)} × {pax}
                      </p>
                    </div>
                    <Link
                      to="/flights/book"
                      search={{
                        flightId: f.id,
                        depart: search.depart,
                        adults: search.adults,
                        children: search.children,
                      }}
                      className="rounded-full bg-brand px-6 py-3 text-[16px] font-semibold text-brand-foreground"
                    >
                      Select
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <Plane className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-[16px] text-muted-foreground">
              No fares on {search.from} → {search.to} yet. Try another route.
            </p>
          </div>
        )}
      </section>

      <Sheet
        open={open}
        title="Search flights"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={apply}
            className="w-full rounded-full bg-brand py-4 text-[17px] font-semibold text-brand-foreground"
          >
            Search flights
          </button>
        }
      >
        <div className="flex gap-2 pb-2">
          {["oneway", "return"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrip(t)}
              className={`rounded-full border px-4 py-1.5 text-[14px] font-medium ${
                trip === t ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground"
              }`}
            >
              {t === "oneway" ? "One-way" : "Return"}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <FieldRow label="From">
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
              {(airports.data ?? []).map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.city} ({a.iata})
                </option>
              ))}
            </select>
          </FieldRow>
          <button
            type="button"
            aria-label="Swap airports"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="mb-3 rounded-full border border-border p-3 text-foreground"
          >
            <ArrowLeftRight size={16} />
          </button>
          <FieldRow label="To">
            <select value={to} onChange={(e) => setTo(e.target.value)} className={inputClass}>
              {(airports.data ?? []).map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.city} ({a.iata})
                </option>
              ))}
            </select>
          </FieldRow>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {trip === "return" ? "Depart – Return" : "Depart"}
          </p>
          <p className="mb-2 mt-1 text-[15px] text-foreground">
            {prettyDate(depart)}
            {trip === "return" && ret ? ` – ${prettyDate(ret)}` : ""}
          </p>
          <DateRangeCalendar
            start={depart}
            {...(ret ? { end: ret } : {})}
            single={trip !== "return"}
            onChange={(s, e) => {
              setDepart(s);
              setRet(e ?? "");
            }}
          />
        </div>

        <div className="border-t border-border">
          <Stepper label="Adults" hint="Age 12+" value={adults} min={1} max={9} onChange={setAdults} />
          <Stepper label="Children" hint="Age 2–11" value={kids} max={8} onChange={setKids} />
        </div>

        <FieldRow label="Cabin">
          <select value={cabin} onChange={(e) => setCabin(e.target.value)} className={inputClass}>
            {cabins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </FieldRow>
      </Sheet>
    </AppShell>
  );
}
