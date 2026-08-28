import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase } from "lucide-react";
import { useEffect } from "react";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getMyBookings } from "@/lib/account.functions";
import { bdt, prettyDateTime } from "@/lib/format";
import { getMyOrders } from "@/lib/orders.functions";

export const Route = createFileRoute("/trips")({
  component: TripsPage,
  head: () => ({
    meta: [
      { title: "My Trips — Trips.bd" },
      {
        name: "description",
        content:
          "Stays, flights, activities, transfers, cars, eSIMs and trains — every Trips.bd booking with live status in one feed.",
      },
      { property: "og:title", content: "My Trips — Trips.bd" },
      { property: "og:description", content: "Every booking, every vertical, live status." },
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

type Row = {
  id: string;
  reference: string;
  title: string;
  subtitle: string | null;
  heroUrl: string | null;
  when: string;
  meta: string;
  total: number;
  status: string;
  sortKey: string;
  kind: "order" | "booking";
};

function TripRow({ row }: { row: Row }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-border p-3">
      <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-muted">
        {row.heroUrl ? (
          <img src={row.heroUrl} alt={row.title} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold text-foreground">{row.title}</p>
        <p className="truncate text-[15px] text-muted-foreground">{row.meta}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[13px] font-medium ${
              statusTone[row.status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {row.status}
          </span>
          <span className="text-[15px] font-semibold text-foreground">{bdt(row.total)}</span>
        </div>
      </div>
      {row.kind === "order" ? (
        <Link
          to="/order/$reference"
          params={{ reference: row.reference }}
          className="self-center text-[15px] font-medium text-brand"
        >
          View
        </Link>
      ) : (
        <Link
          to="/booking/$reference"
          params={{ reference: row.reference }}
          className="self-center text-[15px] font-medium text-brand"
        >
          View
        </Link>
      )}
    </li>
  );
}

function TripsPage() {
  const { user, loading } = useAuth();
  const fetchBookings = useServerFn(getMyBookings);
  const fetchOrders = useServerFn(getMyOrders);
  const queryClient = useQueryClient();

  const bookings = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => fetchBookings(),
    enabled: Boolean(user),
  });
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    };
    const channel = supabase
      .channel("trips-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_events" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_events" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, invalidate)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const rows: Row[] = [
    ...(bookings.data ?? []).map((b) => ({
      id: b.id,
      reference: b.reference,
      title: b.listing?.title ?? "Stay",
      subtitle: null,
      heroUrl: b.listing?.hero_url ?? null,
      when: b.check_in,
      meta: `${b.check_in} → ${b.check_out} · ${b.guests} guests`,
      total: b.total_bdt,
      status: b.status,
      sortKey: b.check_out,
      kind: "booking" as const,
    })),
    ...(orders.data ?? []).map((o) => ({
      id: o.id,
      reference: o.reference,
      title: o.title,
      subtitle: o.subtitle,
      heroUrl: o.hero_url,
      when: o.starts_at,
      meta: `${o.vertical} · ${prettyDateTime(o.starts_at)} · ${o.travellers} travellers`,
      total: o.total_bdt,
      status: o.status,
      sortKey: (o.ends_at ?? o.starts_at).slice(0, 10),
      kind: "order" as const,
    })),
  ].sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => r.sortKey >= today && r.status !== "cancelled");
  const past = rows.filter((r) => r.sortKey < today || r.status === "cancelled");
  const isLoading = bookings.isLoading || orders.isLoading;

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

      {user && rows.length === 0 && !isLoading ? (
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
            {upcoming.map((r) => (
              <TripRow key={`${r.kind}-${r.id}`} row={r} />
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="mt-6 px-5">
          <h2 className="pb-3 text-[19px] font-semibold text-foreground">Past</h2>
          <ul className="space-y-3 opacity-80">
            {past.map((r) => (
              <TripRow key={`${r.kind}-${r.id}`} row={r} />
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
