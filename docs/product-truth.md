# Trips.bd — product truth matrix

Single source of truth for what the app actually does. Store listing copy, the privacy
policy and the Play Data Safety declaration must not claim anything absent here.

Last verified: 2026-09-04 against `src/lib/orders.functions.ts`, `src/lib/account.functions.ts`,
`supabase/migrations/*` and all routes in `src/routes/`.

## Booking model

**Request-to-book only.** Every vertical creates a row in `public.orders` (or the legacy
`public.bookings` for stays) with status `pending`. A human confirms it. There is:

- no supplier/GDS API integration,
- no live availability or live fare pricing,
- no in-app payment gateway (`CheckoutPanel` states "No payment now — we confirm
  availability, then send a payment link"; `public.payment_transactions` exists in an early
  migration but no runtime code writes to it),
- no instant confirmation.

Forbidden words in UI and store copy: "instant booking", "book instantly", "confirmed
instantly", "live fares", "real-time availability", "pay now".

## Vertical status

| Vertical | Route | Inventory source | Launch status |
| --- | --- | --- | --- |
| Stays | `stays.tsx`, `listing.$slug.tsx`, `book.$slug.tsx` | `public.listings` (seeded) | request-to-book |
| Flights | `flights.tsx`, `book-flight.tsx` | `public.flights` (seeded) | request-to-book |
| Activities | `activities.index.tsx`, `activities.$slug.tsx` | `public.activities` / `activity_slots` (seeded) | request-to-book |
| Airport transfers | `transfers.tsx` | `public.transfers` (seeded) | request-to-book |
| Car rentals | `cars.tsx` | `public.car_rentals` (seeded) | pending ops sign-off |
| eSIM | `esim.tsx` | `public.esim_plans` (seeded) | pending ops sign-off |
| Trains | `trains.tsx` | `public.trains` (seeded) | pending ops sign-off |
| Packages | `packages.tsx` | `public.packages` (seeded) | pending ops sign-off |

Verticals marked "pending ops sign-off" must either get a named fulfilment owner or be
removed from the home tile grid and store copy before production release (launch gate 8/10).

## Inventory reality

All catalogue rows come from literal `insert into` seed statements in
`supabase/migrations/`. No row represents a contractually available product today.
Before production release, seeded rows must be either replaced with real contracted
inventory or flagged and hidden in production.

## Non-goals for V1

Card payments in-app, Google Play Billing, live supplier APIs, FCM push notifications,
tablet-optimised layouts, offline booking, multi-currency.

## Data actually collected at runtime

| Data | Where it is written | Source |
| --- | --- | --- |
| Email, name (auth) | `auth.users`, `public.profiles` | `src/lib/auth.ts` |
| Phone, avatar, VIP tier | `public.profiles` | `src/lib/account.functions.ts` |
| Order contact name/email/phone | `public.orders` | `createOrder` in `src/lib/orders.functions.ts` |
| Booking details, dates, travellers, total | `public.orders`, `public.bookings` | order/booking functions |
| Saved listings | `public.saved_listings` | `src/routes/saved.tsx` |
| Notifications | `public.notifications` | order status trigger |
| Deletion requests | `public.deletion_requests` | `src/lib/compliance.functions.ts` |
| Support/host form submissions | Tally (third-party processor) | `src/components/TallyForm.tsx` |
| Client error reports | error reporting endpoint | `src/lib/lovable-error-reporting.ts` |

Not collected: precise location, contacts, photos, SMS, health data, financial account
numbers, advertising identifiers.
