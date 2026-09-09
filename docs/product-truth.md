# Trips.bd — product truth matrix

Single source of truth for what the app actually does. Store listing copy, the privacy
policy and the Play Data Safety declaration must not claim anything absent here.

Last verified: 2026-09-05 against `src/lib/orders.functions.ts`, `src/lib/account.functions.ts`,
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
| Car rentals | `cars.tsx` | none | **out of launch scope** — route renders `ComingSoon`, removed from home grid and sitemap |
| eSIM | `esim.tsx` | none | **out of launch scope** — `ComingSoon` |
| Trains | `trains.tsx` | none | **out of launch scope** — `ComingSoon` |
| Packages | `packages.tsx` | none | **out of launch scope** — `ComingSoon` |

Launch scope is exactly four verticals: stays, flights, activities, airport transfers.
Each is fulfilled manually by the Trips.bd ops team.

## Inventory reality

All catalogue rows in the database come from literal `insert into` seed statements in
`supabase/migrations/`. No row represents contracted, available inventory.

Therefore catalogue reads are gated by `src/lib/inventory.ts`:

- server: `INVENTORY_LIVE` (`process.env.INVENTORY_LIVE === "true"`) — every catalogue
  server function returns empty until real supplier rows are loaded,
- client: `inventoryLiveClient` (`VITE_INVENTORY_LIVE`) — while off, stays, flights,
  activities and transfers show `RequestPanel` instead of listings, which writes a real
  `public.orders` row with `total_bdt = 0` (no price is claimed),
- the sitemap omits listing/activity detail URLs while the gate is off.

Nothing seeded is presented to a traveller as bookable.

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
| Deletion requests + anonymised audit | `public.deletion_requests`, `public.deletion_audit` | `src/lib/compliance.functions.ts`, `src/lib/deletion.server.ts` |
| Support messages | `public.support_messages` | `src/components/SupportForm.tsx` (first-party; deleted on account deletion) |
| Client error reports | error reporting endpoint | `src/lib/lovable-error-reporting.ts` |

Not collected: precise location, contacts, photos, SMS, health data, financial account
numbers, advertising identifiers.
