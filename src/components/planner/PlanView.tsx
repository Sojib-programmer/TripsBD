import { Link } from "@tanstack/react-router";
import {
  Beer,
  Bus,
  Building2,
  Coffee,
  Landmark,
  MapPin,
  Music,
  Palmtree,
  ShoppingBag,
  Ticket,
  Trash2,
  Trees,
  UtensilsCrossed,
} from "lucide-react";
import type { ComponentType } from "react";

export type PlanDay = { id: string; date: string; sort_order: number };
export type PlanSpot = {
  id: string;
  day_id: string | null;
  name: string;
  spot_type: string;
  type_label: string | null;
  address: string | null;
  slot_index: number;
  listing?: { slug: string; title: string } | null;
  activity?: { slug: string; title: string } | null;
};
export type PlanRecord = {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  hero_url: string | null;
};

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  bar: Beer,
  attraction: Ticket,
  museum: Landmark,
  park: Trees,
  shopping: ShoppingBag,
  entertainment: Music,
  hotel: Building2,
  transit: Bus,
  beach: Palmtree,
  nightlife: Music,
};

function dayLabel(date: string, index: number) {
  const d = new Date(`${date}T00:00:00Z`);
  const pretty = Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
  return `Day ${index + 1} · ${pretty}`;
}

export function PlanView({
  plan,
  days,
  spots,
  onDeleteSpot,
  onMoveSpot,
}: {
  plan: PlanRecord;
  days: PlanDay[];
  spots: PlanSpot[];
  onDeleteSpot: (spotId: string) => void;
  onMoveSpot: (spotId: string, dayId: string) => void;
}) {
  if (!days.length) {
    return (
      <div className="mx-5 my-6 rounded-2xl border border-dashed border-border p-6 text-center">
        <MapPin size={28} className="mx-auto text-brand" />
        <p className="mt-3 text-[15px] text-muted-foreground">
          Tell the planner where you want to go and how many days you have. Your itinerary appears
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="relative mx-5 mt-4 h-[140px] overflow-hidden rounded-2xl bg-muted">
        {plan.hero_url ? (
          <img
            src={plan.hero_url}
            alt={plan.destination ?? plan.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
          <p className="text-[19px] font-semibold text-white">{plan.title}</p>
          <p className="text-[13px] text-white/80">
            {plan.destination}
            {plan.start_date ? ` · ${plan.start_date} → ${plan.end_date}` : ""}
          </p>
        </div>
      </div>

      {days.map((day, i) => {
        const daySpots = spots
          .filter((s) => s.day_id === day.id)
          .sort((a, b) => a.slot_index - b.slot_index);
        return (
          <section key={day.id} className="mt-5 px-5">
            <h3 className="text-[15px] font-semibold uppercase tracking-wide text-muted-foreground">
              {dayLabel(day.date, i)}
            </h3>
            <ul className="mt-2 space-y-2">
              {daySpots.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border p-3 text-[15px] text-muted-foreground">
                  Nothing planned. Ask the planner to fill this day.
                </li>
              ) : null}
              {daySpots.map((spot) => {
                const Icon = ICONS[spot.spot_type] ?? MapPin;
                return (
                  <li key={spot.id} className="flex gap-3 rounded-xl border border-border p-3">
                    <Icon size={20} className="mt-0.5 shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-medium text-foreground">
                        {spot.name}
                      </p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {spot.type_label ?? spot.spot_type}
                        {spot.address ? ` · ${spot.address}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {spot.listing ? (
                          <Link
                            to="/listing/$slug"
                            params={{ slug: spot.listing.slug }}
                            className="text-[13px] font-semibold text-brand"
                          >
                            Request to book
                          </Link>
                        ) : null}
                        {spot.activity ? (
                          <Link
                            to="/activities/$slug"
                            params={{ slug: spot.activity.slug }}
                            className="text-[13px] font-semibold text-brand"
                          >
                            Request to book
                          </Link>
                        ) : null}
                        {days.length > 1 ? (
                          <select
                            aria-label={`Move ${spot.name} to another day`}
                            value={spot.day_id}
                            onChange={(e) => onMoveSpot(spot.id, e.target.value)}
                            className="rounded-full border border-border bg-background px-2 py-1 text-[13px] text-muted-foreground"
                          >
                            {days.map((d, di) => (
                              <option key={d.id} value={d.id}>
                                Day {di + 1}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${spot.name}`}
                      onClick={() => onDeleteSpot(spot.id)}
                      className="self-start text-muted-foreground"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="mx-5 mt-6 rounded-xl bg-muted p-3 text-[13px] leading-snug text-muted-foreground">
        Suggestions are advisory. Trips.bd is request-to-book: availability and price are confirmed
        by our team before anything is reserved.
      </p>
    </div>
  );
}
