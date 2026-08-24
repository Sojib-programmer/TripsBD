import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, inputClass, Sheet } from "@/components/search/Sheet";
import { Stepper } from "@/components/search/Stepper";
import { addDays, nightsBetween, prettyDate, today } from "@/lib/format";
import { searchListings } from "@/lib/catalog.functions";

type StaySearch = {
  q: string;
  kind: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  sort: string;
};

export const Route = createFileRoute("/stays")({
  validateSearch: (s: Record<string, unknown>): StaySearch => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    kind: typeof s["kind"] === "string" ? s["kind"] : "all",
    checkIn: typeof s["checkIn"] === "string" && s["checkIn"] ? s["checkIn"] : today(),
    checkOut:
      typeof s["checkOut"] === "string" && s["checkOut"] ? s["checkOut"] : addDays(today(), 2),
    rooms: Number(s["rooms"] ?? 1) || 1,
    adults: Number(s["adults"] ?? 2) || 2,
    children: Number(s["children"] ?? 0) || 0,
    sort: typeof s["sort"] === "string" ? s["sort"] : "recommended",
  }),
  component: StaysPage,
  head: () => ({
    meta: [
      { title: "Hotels & homes in Bangladesh — Trips.bd" },
      {
        name: "description",
        content:
          "Search hotels, resorts, villas and homes across Cox's Bazar, Sylhet, Dhaka and Chattogram. Pick your dates, rooms and guests and book in seconds.",
      },
      { property: "og:title", content: "Hotels & homes in Bangladesh — Trips.bd" },
      { property: "og:description", content: "Where to stay, when to go and who's coming." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const kindChips = [
  { id: "all", label: "All stays" },
  { id: "hotel", label: "Hotels" },
  { id: "resort", label: "Resorts" },
  { id: "home", label: "Homes" },
  { id: "apartment", label: "Apartments" },
  { id: "villa", label: "Villas" },
];

const sortChips = [
  { id: "recommended", label: "Recommended" },
  { id: "price_low", label: "Price low" },
  { id: "price_high", label: "Price high" },
  { id: "rating", label: "Top rated" },
];

function StaysPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);

  const [where, setWhere] = useState(search.q);
  const [checkIn, setCheckIn] = useState(search.checkIn);
  const [checkOut, setCheckOut] = useState(search.checkOut);
  const [rooms, setRooms] = useState(search.rooms);
  const [adults, setAdults] = useState(search.adults);
  const [kids, setKids] = useState(search.children);

  const guests = search.adults + search.children;
  const nights = nightsBetween(search.checkIn, search.checkOut);

  const results = useQuery({
    queryKey: ["stays", search.q, search.kind, guests],
    queryFn: () =>
      searchListings({
        data: {
          q: search.q || undefined,
          guests,
          ...(search.kind !== "all"
            ? { kind: search.kind as "hotel" | "home" | "apartment" | "resort" | "villa" }
            : {}),
        },
      }),
  });

  const rows = [...(results.data ?? [])].sort((a, b) => {
    if (search.sort === "price_low") return a.price_bdt - b.price_bdt;
    if (search.sort === "price_high") return b.price_bdt - a.price_bdt;
    if (search.sort === "rating") return Number(b.rating) - Number(a.rating);
    return 0;
  });

  const apply = () => {
    void navigate({
      to: "/stays",
      search: {
        ...search,
        q: where,
        checkIn,
        checkOut: checkOut || addDays(checkIn, 1),
        rooms,
        adults,
        children: kids,
      },
    });
    setOpen(false);
  };

  return (
    <AppShell>
      <VerticalHeader
        title={search.q || "Anywhere in Bangladesh"}
        summary={`${prettyDate(search.checkIn)} – ${prettyDate(search.checkOut)} · ${nights} night${
          nights > 1 ? "s" : ""
        } · ${search.rooms} room${search.rooms > 1 ? "s" : ""}, ${guests} guests`}
        onEdit={() => setOpen(true)}
      />

      <ChipBar
        chips={kindChips}
        active={search.kind}
        onSelect={(kind) => void navigate({ to: "/stays", search: { ...search, kind } })}
      />
      <ChipBar
        chips={sortChips}
        active={search.sort}
        onSelect={(sort) => void navigate({ to: "/stays", search: { ...search, sort } })}
      />

      <section className="px-5 py-4">
        {results.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : rows.length ? (
          <>
            <p className="text-[15px] text-muted-foreground">{rows.length} properties found</p>
            <div className="mt-3 space-y-6">
              {rows.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No stays match that search yet.{" "}
            <Link to="/" className="font-medium text-brand">
              Browse everything
            </Link>
          </p>
        )}
      </section>

      <Sheet
        open={open}
        title="Search stays"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={apply}
            className="w-full rounded-full bg-brand py-4 text-[17px] font-semibold text-brand-foreground"
          >
            Search
          </button>
        }
      >
        <FieldRow label="Where">
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Cox's Bazar, Sylhet, Dhaka…"
            className={inputClass}
          />
        </FieldRow>

        <div className="border-t border-border pt-3">
          <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            When
          </p>
          <p className="mb-2 mt-1 text-[15px] text-foreground">
            {prettyDate(checkIn)} {checkOut ? `– ${prettyDate(checkOut)}` : "– select check-out"}
          </p>
          <DateRangeCalendar
            start={checkIn}
            {...(checkOut ? { end: checkOut } : {})}
            onChange={(s, e) => {
              setCheckIn(s);
              setCheckOut(e ?? "");
            }}
          />
        </div>

        <div className="border-t border-border">
          <Stepper label="Rooms" value={rooms} min={1} max={9} onChange={setRooms} />
          <Stepper label="Adults" hint="Age 18+" value={adults} min={1} max={16} onChange={setAdults} />
          <Stepper label="Children" hint="Age 0–17" value={kids} max={10} onChange={setKids} />
        </div>
      </Sheet>
    </AppShell>
  );
}
