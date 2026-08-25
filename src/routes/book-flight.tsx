import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { VerticalHeader } from "@/components/VerticalHeader";
import { arrivalDayOffset, bdt, duration, hhmm, prettyDate, today } from "@/lib/format";
import { getFlight } from "@/lib/verticals.functions";

export const Route = createFileRoute("/book-flight")({
  validateSearch: (s: Record<string, unknown>) => ({
    flightId: typeof s["flightId"] === "string" ? s["flightId"] : "",
    depart: typeof s["depart"] === "string" && s["depart"] ? s["depart"] : today(),
    adults: Number(s["adults"] ?? 1) || 1,
    children: Number(s["children"] ?? 0) || 0,
  }),
  component: BookFlightPage,
  head: () => ({
    meta: [
      { title: "Review your flight — Trips.bd" },
      {
        name: "description",
        content: "Check your fare, baggage and traveller details before sending your flight request.",
      },
      { property: "og:title", content: "Review your flight — Trips.bd" },
      { property: "og:description", content: "Fare, baggage and traveller details in one screen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function BookFlightPage() {
  const { flightId, depart, adults, children } = Route.useSearch();
  const pax = adults + children;

  const q = useQuery({
    queryKey: ["flight", flightId],
    queryFn: () => getFlight({ data: { id: flightId } }),
    enabled: Boolean(flightId),
  });

  const f = q.data;

  return (
    <AppShell>
      <VerticalHeader title="Review your flight" summary={prettyDate(depart)} />
      <div className="space-y-5 px-5 py-5">
        {q.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : !f ? (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            That fare is no longer available.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-[15px] font-medium text-foreground">
                {f.airline} · {f.flight_no}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div>
                  <p className="text-[20px] font-semibold text-foreground">
                    {hhmm(f.depart_time)}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{f.from_iata}</p>
                </div>
                <div className="flex-1 text-center text-[12px] text-muted-foreground">
                  {duration(f.duration_min)}
                  <div className="my-1 h-px bg-border" />
                  {f.stops === 0 ? "Direct" : `${f.stops} stop`}
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-semibold text-foreground">
                    {hhmm(f.arrive_time)}
                    {arrivalDayOffset(f.depart_time, f.arrive_time) ? (
                      <sup className="text-[12px] text-dot-red"> +1</sup>
                    ) : null}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{f.to_iata}</p>
                </div>
              </div>
              <p className="mt-3 border-t border-border pt-3 text-[13px] text-muted-foreground">
                {f.cabin} · {f.baggage_kg}kg checked · {f.cabin_baggage_kg}kg cabin
                {f.refundable ? " · refundable" : " · non-refundable"}
              </p>
            </div>

            <CheckoutPanel
              draft={{
                vertical: "flight",
                itemId: f.id,
                title: `${f.from_iata} → ${f.to_iata}`,
                subtitle: `${f.airline} ${f.flight_no} · ${hhmm(f.depart_time)}`,
                startsAt: new Date(`${depart}T${f.depart_time}`).toISOString(),
                travellers: pax,
                totalBdt: f.fare_bdt * pax,
                details: {
                  flight_no: f.flight_no,
                  cabin: f.cabin,
                  adults,
                  children,
                  baggage_kg: f.baggage_kg,
                },
              }}
              breakdown={[
                { label: `Fare × ${pax}`, value: bdt(f.fare_bdt * pax) },
                { label: "Taxes & fees", value: "Included" },
              ]}
              cta="Request this fare"
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
