import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { VerticalHeader } from "@/components/VerticalHeader";
import { supabase } from "@/integrations/supabase/client";
import { bdt, prettyDateTime } from "@/lib/format";
import { getOrderByReference } from "@/lib/orders.functions";

export const Route = createFileRoute("/order/$reference")({
  component: OrderPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="p-6 text-[16px] text-muted-foreground">
        {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="p-6 text-[16px] text-muted-foreground">Booking not found.</p>
    </AppShell>
  ),
  head: () => ({
    meta: [
      { title: "Your booking — Trips.bd" },
      {
        name: "description",
        content: "Live status, reference number and details for your Trips.bd booking request.",
      },
      { property: "og:title", content: "Your booking — Trips.bd" },
      { property: "og:description", content: "Track your request in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const statusIcon = {
  pending: Clock,
  confirmed: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
} as const;

function OrderPage() {
  const { reference } = Route.useParams();
  const fetchOrder = useServerFn(getOrderByReference);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["order", reference],
    queryFn: () => fetchOrder({ data: { reference } }),
  });

  const orderId = q.data?.order.id;

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_events", filter: `order_id=eq.${orderId}` },
        () => void qc.invalidateQueries({ queryKey: ["order", reference] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, qc, reference]);

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      </AppShell>
    );
  }

  if (!q.data) {
    return (
      <AppShell>
        <VerticalHeader title="Booking" />
        <p className="p-6 text-[16px] text-muted-foreground">
          We couldn&apos;t find {reference}.{" "}
          <Link to="/trips" className="font-medium text-brand">
            See all trips
          </Link>
        </p>
      </AppShell>
    );
  }

  const { order, events } = q.data;
  const Icon = statusIcon[order.status];

  return (
    <AppShell>
      <VerticalHeader title={order.title} summary={`Reference ${order.reference}`} />

      <div className="space-y-5 px-5 py-5">
        <div className="rounded-2xl border border-border p-5 text-center">
          <Icon
            size={40}
            className={`mx-auto ${order.status === "cancelled" ? "text-dot-red" : "text-brand"}`}
          />
          <p className="mt-2 text-[20px] font-bold capitalize text-foreground">{order.status}</p>
          {order.subtitle ? (
            <p className="text-[15px] text-muted-foreground">{order.subtitle}</p>
          ) : null}
          <p className="mt-2 text-[15px] text-muted-foreground">
            {prettyDateTime(order.starts_at)} · {order.travellers} traveller
            {order.travellers > 1 ? "s" : ""}
          </p>
          <p className="mt-2 text-[24px] font-bold text-foreground">{bdt(order.total_bdt)}</p>
        </div>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">Status timeline</h2>
          <ol className="mt-3 space-y-3 border-l border-border pl-4">
            {events.map((e) => (
              <li key={e.id}>
                <p className="text-[15px] font-medium capitalize text-foreground">{e.status}</p>
                <p className="text-[14px] text-muted-foreground">{e.message}</p>
                <p className="text-[13px] text-muted-foreground">{prettyDateTime(e.created_at)}</p>
              </li>
            ))}
          </ol>
        </section>

        <Link
          to="/trips"
          className="block rounded-full border border-border py-3 text-center text-[17px] font-semibold text-foreground"
        >
          View all trips
        </Link>
      </div>
    </AppShell>
  );
}
