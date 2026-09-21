import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Map, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { createPlan, deletePlan, listMyPlans } from "@/lib/planner.functions";

export const Route = createFileRoute("/plan/")({
  component: PlanIndex,
  head: () => ({
    meta: [
      { title: "Trip planner — Trips.bd" },
      {
        name: "description",
        content:
          "Describe your trip and the Trips.bd planner builds a day-by-day itinerary you can edit, save and turn into booking requests.",
      },
      { property: "og:title", content: "Trip planner — Trips.bd" },
      {
        property: "og:description",
        content: "Describe your trip, get a day-by-day itinerary you can edit and save.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PlanIndex() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPlans = useServerFn(listMyPlans);
  const create = useServerFn(createPlan);
  const remove = useServerFn(deletePlan);

  const plans = useQuery({
    queryKey: ["trip-plans"],
    queryFn: () => fetchPlans(),
    enabled: Boolean(user),
  });

  const newPlan = useMutation({
    mutationFn: () => create(),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
      void navigate({ to: "/plan/$planId", params: { planId: plan.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePlan = useMutation({
    mutationFn: (planId: string) => remove({ data: { planId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
      toast.success("Plan deleted");
    },
    onError: () => toast.error("Could not delete that plan"),
  });

  return (
    <AppShell>
      <PageHeader title="Trip planner" subtitle="Describe a trip, get a day-by-day plan" />

      {!user && !loading ? (
        <EmptyState
          icon={<Map size={34} />}
          title="Sign in to plan a trip"
          body="Your plans are saved to your account so you can pick them up on any device."
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

      {user ? (
        <div className="px-5">
          <button
            type="button"
            onClick={() => newPlan.mutate()}
            disabled={newPlan.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground disabled:opacity-60"
          >
            <Plus size={18} /> New trip plan
          </button>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Free plan: up to 3 saved trips and 5 planner messages a day.
          </p>

          <ul className="mt-5 space-y-3">
            {(plans.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <div className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.hero_url ? (
                    <img
                      src={p.hero_url}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <Link
                  to="/plan/$planId"
                  params={{ planId: p.id }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-[17px] font-semibold text-foreground">{p.title}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {p.destination
                      ? `${p.destination}${p.start_date ? ` · ${p.start_date} → ${p.end_date}` : ""}`
                      : "Draft — no destination yet"}
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => removePlan.mutate(p.id)}
                  className="text-muted-foreground"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>

          {plans.data && plans.data.length === 0 ? (
            <EmptyState
              icon={<Map size={34} />}
              title="No plans yet"
              body="Start one and tell the planner something like: 4 days in Cox's Bazar, beachfront, seafood, mid-budget."
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
