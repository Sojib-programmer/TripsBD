import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { useEffect } from "react";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { prettyDateTime } from "@/lib/format";
import { getMyNotifications, markNotificationsRead } from "@/lib/orders.functions";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — Trips.bd" },
      {
        name: "description",
        content: "Live booking status updates, confirmations and travel reminders from Trips.bd.",
      },
      { property: "og:title", content: "Notifications — Trips.bd" },
      { property: "og:description", content: "Live updates on every booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function NotificationsPage() {
  const { user, loading } = useAuth();
  const fetchList = useServerFn(getMyNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchList(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user || !q.data?.length) return;
    if (!q.data.some((n) => !n.read_at)) return;
    void markRead().then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
  }, [user, q.data, markRead, queryClient]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const rows = q.data ?? [];

  return (
    <AppShell>
      <PageHeader title="Notifications" subtitle="Booking status and travel updates" />

      {!user && !loading ? (
        <EmptyState
          icon={<Bell size={34} />}
          title="Sign in for updates"
          body="Confirmations, status changes and reminders arrive here in real time."
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

      {user && !q.isLoading && rows.length === 0 ? (
        <EmptyState
          icon={<Bell size={34} />}
          title="Nothing yet"
          body="Once you request a booking we'll keep you posted here."
        />
      ) : null}

      <ul className="space-y-3 px-5">
        {rows.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border p-4 ${
              n.read_at ? "border-border" : "border-brand bg-brand/5"
            }`}
          >
            <p className="text-[16px] font-semibold text-foreground">{n.title}</p>
            {n.body ? <p className="mt-1 text-[15px] text-muted-foreground">{n.body}</p> : null}
            <div className="mt-2 flex items-center justify-between text-[13px] text-muted-foreground">
              <span>{prettyDateTime(n.created_at)}</span>
              {n.order_reference ? (
                <Link
                  to="/order/$reference"
                  params={{ reference: n.order_reference }}
                  className="font-medium text-brand"
                >
                  View order
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
