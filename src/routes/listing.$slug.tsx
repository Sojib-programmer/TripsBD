import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bath, BedDouble, Check, Heart, Star, Users } from "lucide-react";
import { toast } from "sonner";

import { bdt } from "@/components/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { toggleSaved } from "@/lib/account.functions";
import { getListing } from "@/lib/catalog.functions";

const listingQuery = (slug: string) =>
  queryOptions({
    queryKey: ["listing", slug],
    queryFn: () => getListing({ data: { slug } }),
  });

export const Route = createFileRoute("/listing/$slug")({
  loader: async ({ context, params }) => {
    const listing = await context.queryClient.ensureQueryData(listingQuery(params.slug));
    if (!listing) throw notFound();
    return listing;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title}, ${loaderData.city} — Trips.bd` : "Stay — Trips.bd";
    const description =
      loaderData?.summary ?? "Book this stay on Trips.bd with member prices and instant confirmation.";
    const image = loaderData?.hero_url ?? undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image?.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: ListingPage,
  errorComponent: () => (
    <div className="p-8 text-center text-muted-foreground">This stay could not be loaded.</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">This stay is no longer available.</div>
  ),
});

function ListingPage() {
  const { slug } = Route.useParams();
  const { data: listing } = useSuspenseQuery(listingQuery(slug));
  const { user } = useAuth();
  const save = useServerFn(toggleSaved);

  const saveMutation = useMutation({
    mutationFn: (listingId: string) => save({ data: { listingId } }),
    onSuccess: (res) => toast.success(res.saved ? "Saved to your shortlist" : "Removed from saved"),
    onError: () => toast.error("Could not update your shortlist"),
  });

  if (!listing) return null;
  const photos = listing.photos?.length ? listing.photos : listing.hero_url ? [listing.hero_url] : [];

  return (
    <main className="mx-auto max-w-[440px] pb-32">
      <div className="relative">
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {photos.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${listing.title} photo ${i + 1}`}
              className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
        <Link
          to="/"
          aria-label="Back"
          className="absolute left-4 top-4 rounded-full bg-background/90 p-2 backdrop-blur"
        >
          <ArrowLeft size={20} />
        </Link>
        <button
          type="button"
          aria-label="Save this place"
          onClick={() =>
            user ? saveMutation.mutate(listing.id) : toast.info("Sign in to save places")
          }
          className="absolute right-4 top-4 rounded-full bg-background/90 p-2 backdrop-blur"
        >
          <Heart size={20} />
        </button>
      </div>

      <section className="px-5 pt-5">
        <h1 className="font-display text-[26px] font-semibold leading-tight text-foreground">
          {listing.title}
        </h1>
        <p className="mt-1 text-[16px] text-muted-foreground">
          {listing.city}, {listing.country}
        </p>
        <p className="mt-2 flex items-center gap-2 text-[15px] text-foreground">
          <Star size={15} className="fill-current" />
          {Number(listing.rating).toFixed(2)}
          <span className="text-muted-foreground">· {listing.review_count} reviews</span>
        </p>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2 border-y border-border px-5 py-4 text-[14px] text-foreground">
        <span className="flex items-center gap-2">
          <Users size={18} className="text-brand" /> {listing.max_guests} guests
        </span>
        <span className="flex items-center gap-2">
          <BedDouble size={18} className="text-brand" /> {listing.beds} beds
        </span>
        <span className="flex items-center gap-2">
          <Bath size={18} className="text-brand" /> {listing.baths} baths
        </span>
      </section>

      {listing.description ? (
        <section className="px-5 py-5">
          <p className="text-[16px] leading-relaxed text-foreground">{listing.description}</p>
        </section>
      ) : null}

      {listing.amenities?.length ? (
        <section className="border-t border-border px-5 py-5">
          <h2 className="text-[20px] font-semibold text-foreground">What this place offers</h2>
          <ul className="mt-3 space-y-2">
            {listing.amenities.map((a) => (
              <li key={a} className="flex items-center gap-3 text-[16px] text-foreground">
                <Check size={18} className="text-brand" />
                {a}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[440px] border-t border-border bg-background px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[18px] font-semibold text-foreground">{bdt(listing.price_bdt)}</p>
            <p className="text-[14px] text-muted-foreground">per night</p>
          </div>
          <Link
            to="/book/$slug"
            params={{ slug: listing.slug }}
            className="rounded-full bg-brand px-8 py-3 text-[17px] font-semibold text-brand-foreground"
          >
            Reserve
          </Link>
        </div>
      </div>
    </main>
  );
}
