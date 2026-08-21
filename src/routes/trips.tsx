import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase } from "lucide-react";
import { useEffect } from "react";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { bdt } from "@/components/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getMyBookings } from "@/lib/account.functions";

export const Route = createFileRoute("/trips")({
  component: TripsPage,
  head: () => ({
    meta: [
      { title: "My Trips — Trips.bd" },
      { name: "description", content: "View upcoming and past bookings, tickets and itineraries on Trips.bd." },
      { property: "og:title", content: "My Trips — Trips.bd" },
      { property: "og:description", content: "Upcoming and past bookings in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const statusTone: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-brand/10 text-brand",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-foreground",
};

type Booking = Awaited<ReturnType<typeof getMyBookings>>[number];

function BookingRow({ booking }: { booking: Booking }) {
  const listing = booking.listing;
  return (
    <li className="flex gap-3 rounded-2xl border border-border p-3">
      <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-muted">
        {listing?.hero_url ? (
          <img
            src={listing.hero_url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold text-foreground">
          {listing?.title ?? "Stay"}
        </p>
        <p className="truncate text-[15px] text-muted-foreground">
          {booking.check_in} → {booking.check_out} · {booking.guests} guests
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[13px] font-medium ${
              statusTone[booking.status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {booking.status}
          </span>
          <span className="text-[15px] font-semibold text-foreground">
            {bdt(booking.total_bdt)}
          </span>
        </div>
      </div>
      <Link
        to="/booking/$reference"
        params={{ reference: booking.reference }}
        className="self-center text-[15px] font-medium text-brand"
      >
        View
      </Link>
    </li>
  );
}

function TripsPage() {
  const { user, loading } = useAuth();
  const fetchBookings = useServerFn(getMyBookings);
  const queryClient = useQueryClient();

  const bookings = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => fetchBookings(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("trips-booking-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_events" },
        () => void queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => void queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const today = new Date().toISOString().slice(0, 10);
  const rows = bookings.data ?? [];
  const upcoming = rows.filter((b) => b.check_out >= today && b.status !== "cancelled");
  const past = rows.filter((b) => b.check_out < today || b.status === "cancelled");

  return (
    <AppShell>
      <PageHeader title="My Trips" subtitle="Bookings, tickets and itineraries" />

      {!user && !loading ? (
        <EmptyState
          icon={<Briefcase size={34} />}
          title="Sign in to see your trips"
          body="Your bookings, references and live status updates live here once you sign in."
          action={
            <Link
              to="/auth"
              className="rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground"
            >
              Sign in
            </Link>
          }
        />
      ) : null}

      {user && rows.length === 0 && !bookings.isLoading ? (
        <EmptyState
          icon={<Briefcase size={34} />}
          title="No trips yet"
          body="Once you book a hotel, flight or activity it will show up here with all your details."
        />
      ) : null}

      {upcoming.length > 0 ? (
        <section className="px-5">
          <h2 className="pb-3 text-[19px] font-semibold text-foreground">Upcoming</h2>
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="mt-6 px-5">
          <h2 className="pb-3 text-[19px] font-semibold text-foreground">Past</h2>
          <ul className="space-y-3 opacity-80">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
