import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { searchListings } from "@/lib/catalog.functions";

type SearchParams = { q: string; guests: number };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search['q'] === "string" ? search['q'] : "",
    guests: Number(search['guests'] ?? 2) || 2,
  }),
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search stays — Trips.bd" },
      { name: "description", content: "Search hotels, homes, resorts and villas across Bangladesh by destination, dates and guests." },
      { property: "og:title", content: "Search stays — Trips.bd" },
      { property: "og:description", content: "Find where to stay, when to go and who's coming." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const field =
  "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-[16px] text-foreground outline-none focus:border-brand";

function SearchPage() {
  const { q, guests } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [where, setWhere] = useState(q);
  const [when, setWhen] = useState("");
  const [who, setWho] = useState(guests);

  const results = useQuery({
    queryKey: ["search", q, guests],
    queryFn: () => searchListings({ data: { q: q || undefined, guests } }),
  });

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-foreground">
          Where to?
        </h1>
      </header>

      <form
        className="space-y-3 px-5 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ to: ".", search: { q: where, guests: who } });
        }}
      >
        <label className="block text-[14px] font-medium text-muted-foreground">
          Where
          <div className="relative">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Cox's Bazar, Sylhet, Dhaka…"
              className={`${field} pl-11`}
            />
            {where ? (
              <button
                type="button"
                aria-label="Clear"
                onClick={() => setWhere("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          When
          <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className={field} />
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Who
          <input
            type="number"
            min={1}
            max={20}
            value={who}
            onChange={(e) => setWho(Number(e.target.value) || 1)}
            className={field}
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-brand py-4 text-[17px] font-semibold text-brand-foreground"
        >
          Search
        </button>
      </form>

      <section className="mt-6 px-5">
        {results.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand" />
          </div>
        ) : results.data?.length ? (
          <>
            <p className="text-[15px] text-muted-foreground">{results.data.length} stays</p>
            <div className="mt-3 space-y-6">
              {results.data.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-[16px] text-muted-foreground">
            No stays match that search yet.{" "}
            <Link to="/" className="font-medium text-brand">
              Browse everything
            </Link>
          </p>
        )}
      </section>
    </AppShell>
  );
}
