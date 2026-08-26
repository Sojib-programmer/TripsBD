import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Cog, Loader2, Users } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, inputClass, Sheet } from "@/components/search/Sheet";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { addDays, bdt, nightsBetween, prettyDate, today } from "@/lib/format";
import { listCars } from "@/lib/verticals.functions";

export const Route = createFileRoute("/cars")({
  validateSearch: (s: Record<string, unknown>) => ({
    city: typeof s["city"] === "string" && s["city"] ? s["city"] : "Dhaka",
    pickup: typeof s["pickup"] === "string" && s["pickup"] ? s["pickup"] : today(),
    dropoff:
      typeof s["dropoff"] === "string" && s["dropoff"] ? s["dropoff"] : addDays(today(), 2),
    driver: typeof s["driver"] === "string" ? s["driver"] : "any",
  }),
  component: CarsPage,
  head: () => ({
    meta: [
      { title: "Car rentals in Bangladesh — Trips.bd" },
      {
        name: "description",
        content:
          "Rent cars with or without a driver in Dhaka, Chattogram and Sylhet. Daily BDT rates, verified suppliers, no card needed to request.",
      },
      { property: "og:title", content: "Car rentals — Trips.bd" },
      { property: "og:description", content: "Self-drive or with driver, priced per day in BDT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const cities = ["Dhaka", "Chattogram", "Sylhet", "Cox's Bazar"];
const driverChips = [
  { id: "any", label: "All" },
  { id: "yes", label: "With driver" },
  { id: "no", label: "Self-drive" },
];

function CarsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  const [openCal, setOpenCal] = useState(false);
  const [city, setCity] = useState(search.city);
  const [pickup, setPickup] = useState(search.pickup);
  const [dropoff, setDropoff] = useState(search.dropoff);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["cars", search.city],
    queryFn: () => listCars({ data: { city: search.city } }),
  });

  const days = nightsBetween(search.pickup, search.dropoff);
  const list = (q.data ?? []).filter((c) =>
    search.driver === "any" ? true : search.driver === "yes" ? c.with_driver : !c.with_driver,
  );
  const picked = list.find((c) => c.id === pickedId) ?? null;

  return (
    <AppShell>
      <VerticalHeader
        title={`${search.city} · ${days} days`}
        summary={`${prettyDate(search.pickup)} → ${prettyDate(search.dropoff)}`}
        onEdit={() => setOpen(true)}
      />
      <ChipBar
        chips={driverChips}
        active={search.driver}
        onSelect={(d) => void navigate({ to: "/cars", search: (p) => ({ ...p, driver: d }) })}
      />

      <section className="space-y-3 px-5 py-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : list.length ? (
          list.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPickedId(c.id)}
              className={`flex w-full gap-3 rounded-2xl border p-4 text-left ${
                picked?.id === c.id ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              {c.photo_url ? (
                <img
                  src={c.photo_url}
                  alt={c.model}
                  loading="lazy"
                  className="h-[64px] w-[84px] shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-foreground">{c.model}</p>
                <p className="truncate text-[14px] text-muted-foreground">
                  {c.car_class} · {c.supplier}
                </p>
                <div className="mt-1 flex gap-3 text-[14px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {c.seats}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} /> {c.bags}
                  </span>
                  <span className="flex items-center gap-1">
                    <Cog size={14} /> {c.transmission}
                  </span>
                </div>
              </div>
              <span className="self-center text-right text-[19px] font-bold text-foreground">
                {bdt(c.price_per_day_bdt)}
                <span className="block text-[12px] font-normal text-muted-foreground">per day</span>
              </span>
            </button>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No cars match those filters.
          </p>
        )}
      </section>

      {picked ? (
        <section className="border-t border-border px-5 py-4">
          <CheckoutPanel
            draft={{
              vertical: "car",
              itemId: picked.id,
              title: `${picked.model} · ${search.city}`,
              subtitle: `${picked.car_class} · ${picked.with_driver ? "With driver" : "Self-drive"}`,
              ...(picked.photo_url ? { heroUrl: picked.photo_url } : {}),
              startsAt: `${search.pickup}T10:00:00+06:00`,
              endsAt: `${search.dropoff}T10:00:00+06:00`,
              travellers: picked.seats,
              totalBdt: picked.price_per_day_bdt * days,
              details: { supplier: picked.supplier, days, city: search.city },
            }}
            breakdown={[
              { label: "Pick-up", value: prettyDate(search.pickup) },
              { label: "Drop-off", value: prettyDate(search.dropoff) },
              {
                label: `${bdt(picked.price_per_day_bdt)} × ${days} days`,
                value: bdt(picked.price_per_day_bdt * days),
              },
            ]}
            cta="Request car"
          />
        </section>
      ) : null}

      <Sheet
        open={open}
        title="Car rental"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void navigate({ to: "/cars", search: (p) => ({ ...p, city, pickup, dropoff }) });
            }}
            className="w-full rounded-full bg-brand py-3.5 text-[17px] font-semibold text-brand-foreground"
          >
            Search
          </button>
        }
      >
        <FieldRow label="City">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Pick-up → drop-off">
          <button
            type="button"
            onClick={() => setOpenCal((v) => !v)}
            className="w-full rounded-xl border border-border px-4 py-3 text-left text-[16px] text-foreground"
          >
            {prettyDate(pickup)} → {prettyDate(dropoff)}
          </button>
        </FieldRow>
        {openCal ? (
          <DateRangeCalendar
            start={pickup}
            end={dropoff}
            onChange={(s, e) => {
              setPickup(s);
              setDropoff(e ?? addDays(s, 1));
            }}
          />
        ) : null}
      </Sheet>
    </AppShell>
  );
}
