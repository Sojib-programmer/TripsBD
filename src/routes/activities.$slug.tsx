import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Loader2, Star } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { DateRangeCalendar } from "@/components/search/DateRangeCalendar";
import { FieldRow, Sheet } from "@/components/search/Sheet";
import { Stepper } from "@/components/search/Stepper";
import { VerticalHeader } from "@/components/VerticalHeader";
import { bdt, duration, hhmm, prettyDate, today } from "@/lib/format";
import { getActivity } from "@/lib/verticals.functions";

export const Route = createFileRoute("/activities/$slug")({
  component: ActivityPage,
  head: ({ params }) => ({
    meta: [
      { title: `Book ${params.slug.replace(/-/g, " ")} — Trips.bd` },
      {
        name: "description",
        content:
          "Reserve your spot with instant availability check, Dhaka-time schedules and BDT pricing on Trips.bd.",
      },
      { property: "og:title", content: "Attraction booking — Trips.bd" },
      { property: "og:description", content: "Pick a date, a time slot and travellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ActivityPage() {
  const { slug } = Route.useParams();
  const [date, setDate] = useState(today());
  const [pax, setPax] = useState(2);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [openDate, setOpenDate] = useState(false);

  const q = useQuery({ queryKey: ["activity", slug], queryFn: () => getActivity({ data: { slug } }) });

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-brand" />
        </div>
      </AppShell>
    );
  }

  if (!q.data) {
    return (
      <AppShell>
        <VerticalHeader title="Not found" />
        <p className="px-5 py-10 text-center text-[16px] text-muted-foreground">
          This experience is no longer available.
        </p>
      </AppShell>
    );
  }

  const { activity, slots } = q.data;
  const slot = slots.find((s) => s.id === slotId) ?? slots[0] ?? null;
  const unit = slot?.price_bdt ?? activity.price_bdt;

  return (
    <AppShell>
      <VerticalHeader title={activity.title} summary={`${activity.city}, ${activity.country}`} />

      {activity.hero_url ? (
        <img
          src={activity.hero_url}
          alt={activity.title}
          className="h-[220px] w-full object-cover"
        />
      ) : null}

      <section className="space-y-3 px-5 py-4">
        <div className="flex items-center gap-3 text-[14px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-current text-dot-amber" />
            {activity.rating} ({activity.review_count})
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {duration(activity.duration_min)}
          </span>
        </div>
        <p className="text-[16px] leading-relaxed text-foreground">
          {activity.description ?? activity.summary}
        </p>
        {activity.highlights?.length ? (
          <ul className="space-y-2 pt-1">
            {activity.highlights.map((h: string) => (
              <li key={h} className="flex gap-2 text-[15px] text-foreground">
                <Check size={18} className="mt-0.5 shrink-0 text-brand" />
                {h}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-border px-5 py-4">
        <h2 className="text-[19px] font-semibold text-foreground">Choose date & time</h2>
        <FieldRow label="Date" value={prettyDate(date)} onClick={() => setOpenDate(true)} />
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlotId(s.id)}
              className={`rounded-full border px-4 py-2 text-[14px] font-medium ${
                slot?.id === s.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-muted-foreground"
              }`}
            >
              {hhmm(s.start_time)} · {bdt(s.price_bdt)}
            </button>
          ))}
        </div>
        <Stepper label="Travellers" value={pax} min={1} max={12} onChange={setPax} />
      </section>

      <section className="border-t border-border px-5 py-4">
        <CheckoutPanel
          draft={{
            vertical: "activity",
            itemId: activity.id,
            title: activity.title,
            subtitle: `${activity.city} · ${slot ? hhmm(slot.start_time) : "Flexible"}`,
            ...(activity.hero_url ? { heroUrl: activity.hero_url } : {}),
            startsAt: `${date}T${slot ? slot.start_time : "09:00:00"}+06:00`,
            travellers: pax,
            totalBdt: unit * pax,
            details: { slug: activity.slug, slot: slot?.start_time ?? null, date },
          }}
          breakdown={[
            { label: "Date", value: prettyDate(date) },
            { label: "Time", value: slot ? hhmm(slot.start_time) : "Flexible" },
            { label: `${bdt(unit)} × ${pax} travellers`, value: bdt(unit * pax) },
          ]}
        />
      </section>

      <Sheet open={openDate} title="Select date" onClose={() => setOpenDate(false)}>
        <DateRangeCalendar
          mode="single"
          start={date}
          end=""
          onChange={(s) => {
            setDate(s);
            setOpenDate(false);
          }}
        />
      </Sheet>
    </AppShell>
  );
}
