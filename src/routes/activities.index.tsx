import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Loader2, Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ChipBar, VerticalHeader } from "@/components/VerticalHeader";
import { bdt, duration } from "@/lib/format";
import { listActivities } from "@/lib/verticals.functions";

export const Route = createFileRoute("/activities/")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s["category"] === "string" ? s["category"] : "all",
  }),
  component: ActivitiesPage,
  head: () => ({
    meta: [
      { title: "Attractions & tours in Bangladesh — Trips.bd" },
      {
        name: "description",
        content:
          "Book tea garden walks in Srimangal, Old Dhaka food tours, Sundarbans cruises and Cox's Bazar day trips with instant confirmation.",
      },
      { property: "og:title", content: "Attractions & tours in Bangladesh — Trips.bd" },
      { property: "og:description", content: "Things to do, picked for Bangladesh travellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const chips = [
  { id: "all", label: "All" },
  { id: "tour", label: "Tours" },
  { id: "water", label: "Water" },
  { id: "culture", label: "Culture" },
  { id: "food", label: "Food" },
  { id: "adventure", label: "Adventure" },
  { id: "service", label: "Services" },
];

function ActivitiesPage() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();

  const q = useQuery({
    queryKey: ["activities", category],
    queryFn: () => listActivities({ data: { category } }),
  });

  return (
    <AppShell>
      <VerticalHeader title="Attractions & tours" summary="Across Bangladesh" />
      <ChipBar
        chips={chips}
        active={category}
        onSelect={(c) => void navigate({ to: "/activities", search: { category: c } })}
      />

      <section className="space-y-4 px-5 py-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : (q.data ?? []).length ? (
          (q.data ?? []).map((a) => (
            <Link
              key={a.id}
              to="/activities/$slug"
              params={{ slug: a.slug }}
              className="block overflow-hidden rounded-2xl border border-border"
            >
              {a.hero_url ? (
                <img
                  src={a.hero_url}
                  alt={a.title}
                  loading="lazy"
                  className="h-[170px] w-full object-cover"
                />
              ) : null}
              <div className="p-4">
                <p className="text-[13px] uppercase tracking-wide text-muted-foreground">
                  {a.category} · {a.city}
                </p>
                <p className="mt-1 text-[17px] font-semibold text-foreground">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-[15px] text-muted-foreground">{a.summary}</p>
                <div className="mt-2 flex items-center gap-3 text-[14px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="fill-current text-dot-amber" />
                    {a.rating} ({a.review_count})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {duration(a.duration_min)}
                  </span>
                </div>
                <p className="mt-2 text-[19px] font-bold text-foreground">
                  {bdt(a.price_bdt)}{" "}
                  <span className="text-[14px] font-normal text-muted-foreground">per person</span>
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            Nothing in this category yet.
          </p>
        )}
      </section>
    </AppShell>
  );
}
