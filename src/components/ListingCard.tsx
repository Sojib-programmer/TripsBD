import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  city: string;
  country?: string | null;
  hero_url: string | null;
  price_bdt: number;
  rating: number;
  review_count?: number;
  is_guest_favorite?: boolean;
};

export function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export function ListingCard({
  listing,
  saved,
  onToggleSave,
}: {
  listing: ListingCardData;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
}) {
  return (
    <article className="relative">
      <Link to="/listing/$slug" params={{ slug: listing.slug }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          {listing.hero_url ? (
            <img
              src={listing.hero_url}
              alt={`${listing.title} in ${listing.city}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : null}
          {listing.is_guest_favorite ? (
            <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-[13px] font-semibold text-foreground shadow-sm">
              Guest favourite
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold text-foreground">{listing.title}</p>
            <p className="truncate text-[15px] text-muted-foreground">
              {listing.city}
              {listing.country ? `, ${listing.country}` : ""}
            </p>
            <p className="mt-1 text-[15px] text-foreground">
              <span className="font-semibold">{bdt(listing.price_bdt)}</span>
              <span className="text-muted-foreground"> night</span>
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[15px] text-foreground">
            <Star size={14} className="fill-current" />
            {Number(listing.rating).toFixed(2)}
          </span>
        </div>
      </Link>
      {onToggleSave ? (
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save this place"}
          onClick={() => onToggleSave(listing.id)}
          className="absolute right-3 top-3 rounded-full bg-background/80 p-2 backdrop-blur transition-transform active:scale-90"
        >
          <Heart
            size={20}
            className={saved ? "fill-dot-red text-dot-red" : "text-foreground"}
          />
        </button>
      ) : null}
    </article>
  );
}
