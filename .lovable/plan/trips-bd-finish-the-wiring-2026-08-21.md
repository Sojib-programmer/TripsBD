# Trips.bd — finish the wiring

Verified now: `book.$slug`, `booking.$reference`, `listing.$slug`, `search` are the only files touching the data layer. `__root.tsx` has no `<Toaster />` and no auth-state subscriber. `index.tsx`/`HomeScreen`, `trips`, `saved`, `deals`, `more` are still hardcoded shells. `auth.tsx` is OAuth-buttons-only. No typecheck has run against last turn's writes.

## 1. Typecheck first
Run the typecheck before adding anything. Fix whatever the four new route files broke — the likely offender is the functional search updater in `search.tsx` needing route-scoped `navigate` with an explicit `to`.

## 2. Root wiring
In `__root.tsx`: mount `<Toaster />` from `@/components/ui/sonner` (every `toast()` today is silent), and add one `supabase.auth.onAuthStateChange` subscriber filtered to `SIGNED_IN` / `SIGNED_OUT` / `USER_UPDATED` that calls `router.invalidate()` and invalidates queries only when a session exists.

## 3. Home on real data
`index.tsx` loader primes `getHomeFeed` via `ensureQueryData`; `HomeScreen` renders the destinations row and a real listing grid with `ListingCard` (photo, rating, Guest favourite, BDT price), keeps the existing tiles above it, and points the search button at `/search`. Deal strip reads `getDeals`.

## 4. Deals, Saved, Trips
- `deals.tsx`: replace the static array with `getDeals`; each card copies its code.
- `saved.tsx`: `getMySaved` + heart toggle through `toggleSaved` with optimistic update; signed-out shows a sign-in CTA, not a redirect.
- `trips.tsx`: `getMyBookings` split upcoming/past, status pill per booking, and a realtime `booking_events` subscription that invalidates on change.

Saved and Trips are user-scoped, so their reads happen in the component via `useServerFn` + `useQuery`, never in a public loader.

## 5. Account
`more.tsx`: signed-in header from `getMyProfile` (name, avatar, VIP tier), sign-out with query-cache teardown, and rows linking to `/host` and `/support`. Signed-out keeps the current login card pointing at `/auth`.

## 6. Auth screen
`auth.tsx`: keep Google/Apple, add email + password with a sign-in / create-account toggle wired to `signInWithEmail` / `signUpWithEmail`, inline error text, and redirect back to the page the user came from.

## 7. Final pass
Typecheck, then drive the app in a headless browser: home renders DB listings, search returns results, reserve → confirmation writes a booking, saved toggles persist.

## Technical notes
Public reads stay on the publishable-key server functions so SSR and OG tags work on shareable listing links. Realtime channels subscribe inside `useEffect` with `removeChannel` cleanup. Existing tab-transition animation and the onboarding gate are untouched.

## Outside this plan
Google and Apple providers must be enabled in your Supabase dashboard or those buttons fail at runtime — external project, I cannot toggle it. Payments are still out of scope: booking stays request-to-book.
