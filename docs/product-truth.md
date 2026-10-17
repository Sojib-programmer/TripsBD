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
- no charge before human confirmation. After staff confirm, the traveller may pay via
  **EPS-hosted checkout** (`src/lib/eps.functions.ts`). Status becomes `paid` only after
  server-to-server verification with an exact amount match (`api/public/eps/return.ts`).
  Card/wallet credentials are entered on EPS, never on Trips.bd,
- refunds are **manual**: issued in the EPS merchant portal, then recorded by staff in `/ops`
  (`recordRefund`). No EPS refund API is integrated; the app never moves money itself,
- `public.payment_transactions` is legacy and unused,
- no instant confirmation.

Forbidden words in UI and store copy: "instant booking", "book instantly", "confirmed
instantly", "live fares", "real-time availability", "pay now".

## Vertical status

| Vertical          | Route                                              | Inventory source                                | Launch status                                                                            |
| ----------------- | -------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Stays             | `stays.tsx`, `listing.$slug.tsx`, `book.$slug.tsx` | `public.listings` (seeded)                      | request-to-book                                                                          |
| Flights           | `flights.tsx`, `book-flight.tsx`                   | `public.flights` (seeded)                       | request-to-book                                                                          |
| Activities        | `activities.index.tsx`, `activities.$slug.tsx`     | `public.activities` / `activity_slots` (seeded) | request-to-book                                                                          |
| Airport transfers | `transfers.tsx`                                    | `public.transfers` (seeded)                     | request-to-book                                                                          |
| Car rentals       | `cars.tsx`                                         | none                                            | **out of launch scope** — route renders `ComingSoon`, removed from home grid and sitemap |
| eSIM              | `esim.tsx`                                         | none                                            | **out of launch scope** — `ComingSoon`                                                   |
| Trains            | `trains.tsx`                                       | none                                            | **out of launch scope** — `ComingSoon`                                                   |
| Packages          | `packages.tsx`                                     | none                                            | **out of launch scope** — `ComingSoon`                                                   |

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

Google Play Billing, live supplier APIs, FCM push notifications,
tablet-optimised layouts, offline booking, multi-currency.

## Data actually collected at runtime

| Data                                                            | Where it is written                                 | Source                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Email, name (auth)                                              | `auth.users`, `public.profiles`                     | `src/lib/auth.ts`                                                           |
| Phone, avatar, VIP tier                                         | `public.profiles`                                   | `src/lib/account.functions.ts`                                              |
| Order contact name/email/phone                                  | `public.orders`                                     | `createOrder` in `src/lib/orders.functions.ts`                              |
| Booking details, dates, travellers, total                       | `public.orders`, `public.bookings`                  | order/booking functions                                                     |
| Saved listings                                                  | `public.saved_listings`                             | `src/routes/saved.tsx`                                                      |
| Notifications                                                   | `public.notifications`                              | order status trigger                                                        |
| Deletion requests + anonymised audit                            | `public.deletion_requests`, `public.deletion_audit` | `src/lib/compliance.functions.ts`, `src/lib/deletion.server.ts`             |
| Support messages                                                | `public.support_messages`                           | `src/components/SupportForm.tsx` (first-party; deleted on account deletion) |
| Payment records (amount, EPS tx ID, method, status, refund ref) | `public.payment_records`                            | `src/lib/eps.functions.ts`, `src/routes/api/public/eps/return.ts`           |
| Client error reports                                            | error reporting endpoint                            | `src/lib/lovable-error-reporting.ts`                                        |

Not collected: precise location, contacts, photos, SMS, health data, card numbers / wallet
credentials (EPS hosts checkout), advertising identifiers.

## Retention on account deletion

- Deleted: profile, orders, bookings, saved listings, notifications, roles, support messages,
  auth user, and all `payment_records` (FK `ON DELETE CASCADE` to `auth.users`).
- Retained 6 years: `retained_financial_records` (pseudonymous `user_ref`, reference, vertical,
  amount, status) and `deletion_audit` (hashed email). EPS transaction IDs are **not** retained.
- Pseudonyms use `DELETION_PSEUDONYM_SALT`; deletion fails closed if it is missing.

## Play Data Safety — payments (EPS)

- Financial info → **Purchase history**: Collected, not shared for ads; purpose App functionality + Fraud prevention; required for paid bookings.
- Financial info → **Payment info**: NOT collected by Trips.bd (EPS hosted checkout). Declare EPS as service provider receiving name/email/phone (not "sharing" under Play definitions).
- Data encrypted in transit: Yes. Deletion: personal links removed on account deletion; anonymised amounts kept 6 years (legal).
