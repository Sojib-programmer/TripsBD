import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { getMySaved, toggleSaved } from "@/lib/account.functions";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved — Trips.bd" },
      { name: "description", content: "Your shortlisted hotels, homes and activities, saved for later on Trips.bd." },
      { property: "og:title", content: "Saved — Trips.bd" },
      { property: "og:description", content: "Shortlist places and come back when you are ready to book." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SavedPage() {
  const { user, loading } = useAuth();
  const fetchSaved = useServerFn(getMySaved);
  const toggle = useServerFn(toggleSaved);
  const queryClient = useQueryClient();

  const saved = useQuery({
    queryKey: ["saved"],
    queryFn: () => fetchSaved(),
    enabled: Boolean(user),
  });

  const remove = useMutation({
    mutationFn: (listingId: string) => toggle({ data: { listingId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
      toast.success("Removed from saved");
    },
    onError: () => toast.error("Could not update your shortlist"),
  });

  return (
    <AppShell>
      <PageHeader title="Saved" subtitle="Your shortlist" />

      {!user && !loading ? (
        <EmptyState
          icon={<Heart size={34} />}
          title="Sign in to see your shortlist"
          body="Save places you like and they will sync across every device you sign in on."
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

      {user && saved.data && saved.data.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} />}
          title="Nothing saved yet"
          body="Tap the heart on any property to keep it here and track its price."
        />
      ) : null}

      {user && saved.data && saved.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 px-5">
          {saved.data
            .filter((row) => row.listing)
            .map((row) => (
              <ListingCard
                key={row.id}
                listing={row.listing!}
                saved
                onToggleSave={(id) => remove.mutate(id)}
              />
            ))}
        </div>
      ) : null}
    </AppShell>
  );
}
