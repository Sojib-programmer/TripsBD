import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { bdt } from "@/components/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { createBooking } from "@/lib/account.functions";
import { getListing } from "@/lib/catalog.functions";

const listingQuery = (slug: string) =>
  queryOptions({ queryKey: ["listing", slug], queryFn: () => getListing({ data: { slug } }) });

export const Route = createFileRoute("/book/$slug")({
  loader: async ({ context, params }) => {
    const listing = await context.queryClient.ensureQueryData(listingQuery(params.slug));
    if (!listing) throw notFound();
    return listing;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Reserve ${loaderData.title} — Trips.bd` : "Reserve — Trips.bd";
    return {
      meta: [
        { title },
        { name: "description", content: "Confirm your dates, guests and details to reserve this stay on Trips.bd." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Confirm dates, guests and details to reserve." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: BookPage,
  errorComponent: () => (
    <div className="p-8 text-center text-muted-foreground">This reservation could not be started.</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">This stay is no longer available.</div>
  ),
});

function isoPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const field =
  "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-[16px] text-foreground outline-none focus:border-brand";

function BookPage() {
  const { slug } = Route.useParams();
  const { data: listing } = useSuspenseQuery(listingQuery(slug));
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const book = useServerFn(createBooking);

  const [checkIn, setCheckIn] = useState(isoPlus(7));
  const [checkOut, setCheckOut] = useState(isoPlus(9));
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [dealCode, setDealCode] = useState("");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      book({
        data: {
          listingId: listing!.id,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          guestPhone: guestPhone || undefined,
          note: note || undefined,
          dealCode: dealCode || undefined,
        },
      }),
    onSuccess: (booking) => {
      toast.success(`Request sent · ${booking.reference}`);
      void navigate({ to: "/booking/$reference", params: { reference: booking.reference } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create the booking"),
  });

  if (!listing) return null;

  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000),
  );
  const estimate = listing.price_bdt * nights;

  return (
    <main className="mx-auto max-w-[440px] pb-36">
      <header className="flex items-center gap-3 px-5 pt-6">
        <Link to="/listing/$slug" params={{ slug }} aria-label="Back" className="rounded-full border border-border p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-[24px] font-semibold text-foreground">Request to book</h1>
      </header>

      <section className="mx-5 mt-5 flex gap-3 rounded-2xl border border-border p-3">
        {listing.hero_url ? (
          <img src={listing.hero_url} alt={listing.title} className="h-20 w-20 rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-foreground">{listing.title}</p>
          <p className="truncate text-[15px] text-muted-foreground">{listing.city}, {listing.country}</p>
          <p className="mt-1 text-[15px] text-foreground">{bdt(listing.price_bdt)} <span className="text-muted-foreground">night</span></p>
        </div>
      </section>

      {!loading && !user ? (
        <section className="mx-5 mt-5 rounded-2xl border border-border p-4">
          <p className="text-[16px] text-foreground">Sign in to complete your reservation.</p>
          <Link to="/auth" className="mt-3 inline-block rounded-full bg-brand px-6 py-3 text-[16px] font-semibold text-brand-foreground">
            Sign in
          </Link>
        </section>
      ) : null}

      <form
        className="mt-5 space-y-4 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!user) {
            toast.info("Sign in to reserve");
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[14px] font-medium text-muted-foreground">
            Check in
            <input type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={field} />
          </label>
          <label className="block text-[14px] font-medium text-muted-foreground">
            Check out
            <input type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={field} />
          </label>
        </div>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Guests
          <input
            type="number"
            min={1}
            max={listing.max_guests}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={field}
          />
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Full name
          <input required minLength={2} value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Rahim Ahmed" className={field} />
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Email
          <input required type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="name@example.com" className={field} />
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Phone (optional)
          <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+8801XXXXXXXXX" className={field} />
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Promo code (optional)
          <input value={dealCode} onChange={(e) => setDealCode(e.target.value.toUpperCase())} placeholder="FIRST8" className={field} />
        </label>

        <label className="block text-[14px] font-medium text-muted-foreground">
          Message to host (optional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={field} />
        </label>

        <div className="rounded-2xl border border-border p-4 text-[15px]">
          <div className="flex justify-between text-muted-foreground">
            <span>{bdt(listing.price_bdt)} × {nights} nights</span>
            <span>{bdt(estimate)}</span>
          </div>
          <div className="mt-2 flex justify-between text-[17px] font-semibold text-foreground">
            <span>Estimated total</span>
            <span>{bdt(estimate)}</span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">Promo discounts are applied when the request is confirmed.</p>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-[17px] font-semibold text-brand-foreground disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
          Send booking request
        </button>
      </form>
    </main>
  );
}
