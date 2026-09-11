# Trips.bd — Google Play Console submission pack

**Status: not packaged.** The web app ships as a Trusted Web Activity (TWA) built with
Bubblewrap from `android/twa-manifest.json`. The Gradle project, signing key and AAB are
produced on a workstation (JDK 17 + Android SDK) and are not in this repo, and
`public/.well-known/assetlinks.json` still holds placeholder fingerprints. Section 1 below is the build step to be run locally; sections 2–5 are the
Play Console inputs. Release is gated by `docs/launch-gates.md`.

Product claims in this document must match `docs/product-truth.md` — the app is
**request-to-book**, with no live inventory and no in-app payment.

| Item | Location |
| --- | --- |
| Web app manifest | `https://app.trips.bd/manifest.webmanifest` |
| Digital Asset Links | `https://app.trips.bd/.well-known/assetlinks.json` (placeholders — blocker) |
| Privacy policy URL | `https://app.trips.bd/privacy` |
| Terms of use | `https://app.trips.bd/terms` |
| Account/data deletion URL | `https://app.trips.bd/account/delete` |
| Support | `https://app.trips.bd/support` · support@trips.bd · +8801540723530 |
| Registered operator | Marketsync Global Ltd. (trading as Trips.bd), Kashidanga City Gate, Rajpara, Rajshahi-6201, Bangladesh · trade licence 01/13-2665 · TIN 317774303960 |
| App icon 512×512 | `public/store/app-icon-512.png` (verified 512×512) |
| Feature graphic 1024×500 | `public/store/feature-graphic.png` (verified exactly 1024×500) |
| Phone screenshots | `public/store/screenshot-*.png` (1080×1920) |


## 1. Build the Android package

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://app.trips.bd/manifest.webmanifest
# applicationId: bd.trips.app
# host:          app.trips.bd
# start URL:     /?source=pwa
bubblewrap build          # produces app-release-bundle.aab + signing key
keytool -list -v -keystore android.keystore -alias android   # copy the SHA-256
```

Required Android configuration (Play mandates API 36 for new apps and updates as of
2026-08-31):

- `compileSdk` / `targetSdk` **36** (Android 16), `minSdk` **23**
- portrait lock (matches `orientation: portrait` in the manifest)
- App Links intent filter for `app.trips.bd` with `android:autoVerify="true"`
- network security config: no cleartext traffic
- R8/minification enabled for release; upload the mapping file to Play
- back gesture traverses web history and exits only at the root route

Paste the upload-key SHA-256 into `public/.well-known/assetlinks.json`, **and** after upload paste
the **Play App Signing** SHA-256 from Play Console → Setup → App integrity. Both fingerprints must
be live before release, otherwise the app shows a browser URL bar (a Play quality failure).

## 2. Data safety declaration

Every row is backed by a named table/column or source file, checked against
`src/integrations/supabase/types.ts` and `supabase/migrations/`. Do not submit anything
that is not in this table. All data is linked to the user, **none** is shared for
advertising, and **no** advertising ID is collected.

| Play data type | Collected | Exact source in code | Purpose | Optional |
| --- | --- | --- | --- | --- |
| Email address | Yes | `auth.users.email`; `public.orders.contact_email`; `public.support_messages.email`; `public.deletion_requests.email` | Account, booking contact, support, deletion confirmation | No |
| Name | Yes | `public.profiles.full_name`; `public.orders.contact_name`; `public.support_messages.name` | Booking fulfilment, support | No |
| Phone number | Yes | `public.profiles.phone`; `public.orders.contact_phone` | Booking fulfilment | Yes |
| User IDs | Yes | `auth.users.id`; `public.profiles.id`; `user_id` on `orders`, `bookings`, `saved_listings`, `notifications`, `support_messages`, `user_roles` | Account management, RLS ownership | No |
| Photos | Yes (optional) | `public.profiles.avatar_url` — URL only, set from the OAuth provider profile; the app never opens the camera or photo picker | Account personalisation | Yes |
| App interactions | Yes | `public.saved_listings`; `public.orders` (+ `order_events`); `public.bookings` (+ `booking_events`); `public.notifications` | App functionality, request status | No |
| Search history | **No** | Search parameters are read-only URL state consumed by `searchListings` in `src/lib/catalog.functions.ts`; no table, column or log stores them | — | — |
| Other user-generated content | Yes | `public.support_messages.message`/`topic`; free-text request details in `public.orders.details` (JSON) | Customer support, booking fulfilment | Yes |
| Crash logs / diagnostics | Yes | `src/lib/monitoring.ts` (Sentry, `sendDefaultPii: false`, emails/phones/tokens scrubbed by `scrubText`); `src/lib/error-capture.ts`; `src/lib/lovable-error-reporting.ts` | Stability, diagnostics | No |
| Purchase / financial info | **No** | No payment is taken in the app; there is no card, wallet or payment-account column anywhere in the schema | — | — |

**Retention after deletion.** `fulfilAccountDeletion` (`src/lib/deletion.server.ts`) deletes the
profile, orders, bookings, saved listings, notifications, roles, support messages and the auth
user, then writes two non-identifying records that are *not* Data Safety "collected user data"
but must be disclosed in the privacy policy:

- `public.deletion_audit` — `email_hash` (hash, not the address), `user_ref`, `deleted_counts`,
  `retained_note`. Proof-of-deletion record.
- `public.retained_financial_records` — `user_ref` (pseudonymous), `reference`, `total_bdt`,
  `vertical`, `status`, `retain_until`. Kept only to satisfy Bangladesh accounting/tax record
  keeping; contains no name, email, phone or address. Purged after `retain_until`.

Answers to the standard questions:

- Is all data encrypted in transit? **Yes** (HTTPS/TLS everywhere).
- Is data encrypted at rest? **Yes** (Supabase managed Postgres).
- Can users request data deletion? **Yes** — `https://app.trips.bd/account/delete` deletes
  immediately and in full; it is not a queued request (release gate 3).
- Do you collect precise location, contacts, SMS, health, fitness or financial account numbers?
  **No.**
- Do you share data with third parties? No sharing in the Play sense. Processors only:
  **Supabase** (database, auth, hosting of user rows), **Google and Apple** (sign-in only),
  **Cloudflare/Lovable hosting + CDN** (request delivery), **Sentry** (scrubbed crash
  diagnostics). Booking details are passed to the travel supplier fulfilling that specific
  request as part of the service the traveller asked for. Support enquiries are stored
  first-party in `public.support_messages`, not with a third-party form host, so account
  deletion removes them.


## 3. Content rating & audience

- Category: **Travel & Local**
- Target audience: **18+** (bookings create a binding contract)
- No ads, no user-generated content feeds, no gambling, no violence.
- Contains in-app purchases? **No.** No payment is taken in the app at all; travel services
  are paid off-app and are exempt from Google Play Billing.

## 4. Store listing copy

Copy must match `docs/product-truth.md`: request-to-book, human confirmation, no live fares.

**App name:** Trips.bd: Hotels & Flights

**Short description (80 chars):**
Request hotels, flights, activities and transfers across Bangladesh in one app.

**Full description:**
Trips.bd is Bangladesh's all-in-one travel app. Browse hotels, homes and apartments, domestic and
international flights, airport transfers and local activities, then send a booking request — our
team confirms availability and sends you a payment link. Everything is priced in BDT.

- Request a hotel, home or apartment anywhere in Bangladesh
- Request domestic and international flights
- Request airport transfers, tours and activities
- Track every request in My Trips, with status updates as our team works on it
- Cancel any request yourself while it is pending or confirmed
- Save listings for later and get notified when your request status changes

Launch scope is stays, flights, activities and airport transfers only. Car rental, eSIM,
trains and bundled packages are marked "coming soon" in the app and must not be advertised.

No payment is taken in the app. We confirm availability first, then send a secure payment link.

## 5. Pre-launch checklist

- [ ] Both SHA-256 fingerprints present in `assetlinks.json` and deployed
- [ ] `https://app.trips.bd/.well-known/assetlinks.json` returns 200 with `Content-Type: application/json`
- [ ] Privacy policy URL reachable while signed out
- [ ] Deletion URL reachable while signed out, and deletion is actually fulfilled
- [ ] Screenshots at least 1080px on the shortest side, 2–8 per form factor
- [ ] App icon 512×512 PNG, feature graphic exactly 1024×500
- [ ] Data safety form matches the table above line for line
- [ ] App access: reviewer test account credentials supplied (booking is login-gated)
- [ ] `targetSdk` 36, release-signed AAB, mapping file uploaded
- [ ] Test the AAB on internal testing and confirm no URL bar appears
- [ ] All gates in `docs/launch-gates.md` pass
- [ ] `INVENTORY_LIVE` stays unset until contracted supplier inventory is loaded

