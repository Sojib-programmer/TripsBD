# Trips.bd — what's left

## Where things stand

Verified now:

- Backend is live and seeded: 6 destinations, 8 listings, 4 deals, 0 bookings. Tables, RLS, roles, booking event log and realtime are in place.
- The app does **not** talk to the database yet. No file outside `src/integrations/supabase/*` imports the Supabase client — every screen (home tiles, deals list, trips, saved) is hardcoded UI.
- Sign-in is a stub: `src/lib/auth.ts` deliberately throws, so `/auth` renders but can never sign anyone in.
- Routes that exist: `/`, `/welcome`, `/auth`, `/trips`, `/deals`, `/saved`, `/more`. Missing: search, listing detail, booking flow, booking confirmation.

So: the shell and the backend are both done; the wiring between them is the whole remaining job.

## Plan

### 1. Auth (unblocks everything user-scoped)
Replace the throwing stub with real Supabase auth: Google via the Lovable broker, Apple alongside it, plus email fallback. Add a session hook, wire auth-state changes once at the root, and turn the `/more` login card into real signed-in state with avatar, VIP tier and sign-out.

### 2. Explore + search (Airbnb-style)
Home becomes real data: destination row, category filter, listing cards with photo, rating, "Guest favourite" badge and price in BDT — read from `listings`/`destinations`. Add a search overlay (`Where / When / Who`) that filters by destination, dates and guests, and a results screen.

### 3. Listing detail
`/listing/$slug`: photo gallery, title, rating and review count, amenities, sleeping arrangement, host-style block, sticky price bar with a Reserve button.

### 4. Booking flow
`/book/$slug`: date and guest confirmation, price breakdown (nights × rate, deal code discount), guest contact fields, then a write to `bookings`. Confirmation screen with the booking reference. Request-to-book only — no payment step in this pass.

### 5. My Trips + Saved (realtime)
`/trips` lists the user's bookings split upcoming/past, each with its live status and the `booking_events` timeline streaming over realtime. `/saved` becomes a real wishlist backed by `saved_listings`, with a working heart toggle on every card.

### 6. Deals
Read `deals` from the database instead of the hardcoded array, and let a deal code apply at checkout.

## Two decisions I need from you

1. **Booking depth** — request-to-book (as planned above), or full checkout with payments now?
2. **Tally + Semrush** — both are connected but unused. Tally could back a host-application or support form; Semrush is SEO tooling with no in-app surface. Say the word if either has a job, otherwise they stay as credentials only.

## Technical notes

Public reads (listings, destinations, deals) go through public server functions using a server publishable client so SSR and OG tags work on shareable listing links. User-scoped reads and writes (bookings, saved, profile) go through `createServerFn` with `requireSupabaseAuth`, with the protected screens under the `_authenticated` layout. Realtime subscribes on the client inside `useEffect` with cleanup. Existing tab transitions and the onboarding gate stay as they are.
