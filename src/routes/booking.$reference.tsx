import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect } from "react";

import { bdt } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { getBookingByReference, getBookingTimeline } from "@/lib/account.functions";

export const Route = createFileRoute("/booking/$reference")({
  component: ConfirmationPage,
  head: () => ({
    meta: [
      { title: "Booking confirmed — Trips.bd" },
      { name: "description", content: "Your Trips.bd reservation details, status timeline and reference number." },
      { property: "og:title", content: "Booking confirmed — Trips.bd" },
      { property: "og:description", content: "Reservation details and live status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => (
    <div className="p-8 text-center text-muted-foreground">This booking could not be loaded.</div>
  ),
});

function ConfirmationPage() {
  const { reference } = Route.useParams();
  const fetchBooking = useServerFn(getBookingByReference);
  const fetchTimeline = useServerFn(getBookingTimeline);
  const queryClient = useQueryClient();

  const booking = useQuery({
    queryKey: ["booking", reference],
    queryFn: () => fetchBooking({ data: { reference } }),
  });

  const bookingId = booking.data?.id;

  const timeline = useQuery({
    queryKey: ["booking-timeline", bookingId],
    enabled: Boolean(bookingId),
    queryFn: () => fetchTimeline({ data: { bookingId: bookingId! } }),
  });

  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_events", filter: `booking_id=eq.${bookingId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["booking-timeline", bookingId] });
          void queryClient.invalidateQueries({ queryKey: ["booking", reference] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient, reference]);

  if (booking.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="animate-spin text-brand" />
      </div>
    );
  }

  if (!booking.data) {
    return (
      <main className="mx-auto max-w-[440px] px-5 py-16 text-center">
        <p className="text-[17px] text-foreground">We couldn't find booking {reference}.</p>
        <Link to="/trips" className="mt-4 inline-block text-[16px] font-medium text-brand">
          Go to My Trips
        </Link>
      </main>
    );
  }

  const b = booking.data;

  return (
    <main className="mx-auto max-w-[440px] px-5 pb-16 pt-10">
      <CheckCircle2 size={44} className="text-brand" />
      <h1 className="mt-4 font-display text-[28px] font-semibold text-foreground">Reservation requested</h1>
      <p className="mt-1 text-[16px] text-muted-foreground">
        Reference <span className="font-semibold text-foreground">{b.reference}</span> · status {b.status}
      </p>

      <section className="mt-6 flex gap-3 rounded-2xl border border-border p-3">
        {b.listing?.hero_url ? (
          <img src={b.listing.hero_url} alt={b.listing.title} className="h-20 w-20 rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-foreground">{b.listing?.title}</p>
          <p className="truncate text-[15px] text-muted-foreground">{b.listing?.city}, {b.listing?.country}</p>
          <p className="mt-1 text-[15px] text-foreground">{b.check_in} → {b.check_out} · {b.guests} guests</p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border p-4 text-[15px]">
        <div className="flex justify-between text-muted-foreground">
          <span>{b.nights} nights</span>
          <span>{b.deal_code ?? "No promo"}</span>
        </div>
        <div className="mt-2 flex justify-between text-[18px] font-semibold text-foreground">
          <span>Total</span>
          <span>{bdt(b.total_bdt)}</span>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[19px] font-semibold text-foreground">Live status</h2>
        <ol className="mt-3 space-y-3 border-l border-border pl-4">
          {(timeline.data ?? []).map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-brand" />
              <p className="text-[16px] font-medium text-foreground">{e.status}</p>
              {e.message ? <p className="text-[15px] text-muted-foreground">{e.message}</p> : null}
              <p className="text-[13px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
            </li>
          ))}
          {!timeline.data?.length ? (
            <li className="text-[15px] text-muted-foreground">Waiting for the property to respond…</li>
          ) : null}
        </ol>
      </section>

      <div className="mt-8 flex gap-3">
        <Link to="/trips" className="flex-1 rounded-full bg-brand py-3 text-center text-[16px] font-semibold text-brand-foreground">
          My Trips
        </Link>
        <Link to="/support" className="flex-1 rounded-full border border-border py-3 text-center text-[16px] font-semibold text-foreground">
          Need help?
        </Link>
      </div>
    </main>
  );
}
