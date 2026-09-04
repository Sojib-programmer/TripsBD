# Trips.bd — Google Play Console submission pack

**Status: NOT yet packaged.** The web app is *intended* to ship as a Trusted Web Activity
(TWA) built with Bubblewrap. There is no Android/Gradle project, no signing key and no AAB
in this repo yet, and `public/.well-known/assetlinks.json` still holds placeholder
fingerprints. Section 1 below is the build step to be run locally; sections 2–5 are the
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
| Support | `https://app.trips.bd/support` · support@trips.bd |
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

Every row below is backed by a code path in `docs/product-truth.md`. Do not submit a
declaration containing anything not listed there. Collected, linked to the user, **not**
shared with third parties for advertising, **no** advertising ID collected.

| Data type | Collected | Where | Purpose | Optional |
| --- | --- | --- | --- | --- |
| Email address | Yes | `auth.users`, `public.orders.contact_email` | Account, booking contact | No |
| Name | Yes | `public.profiles`, `public.orders.contact_name` | Booking fulfilment | No |
| Phone number | Yes | `public.profiles`, `public.orders.contact_phone` | Booking fulfilment | Yes |
| App interactions (searches, saved items, booking requests) | Yes | `saved_listings`, `orders`, `bookings` | App functionality | No |
| Crash logs / diagnostics | Yes | client error reporting | Stability | No |
| Purchase history | **No** | — | No in-app payment exists at V1 | — |

Answers to the standard questions:

- Is all data encrypted in transit? **Yes** (HTTPS/TLS everywhere).
- Can users request data deletion? **Yes** — `https://app.trips.bd/account/delete`, and the
  request must be *fulfilled*, not just queued (release gate 3).
- Do you collect precise location, contacts, photos, SMS, health or financial account numbers?
  **No.**
- Do you share data with third parties? Only with the travel supplier fulfilling a booking and with
  processors (Supabase, Tally, Google/Apple sign-in, hosting/CDN, error reporting) — declared as
  processing, not sharing.

## 3. Content rating & audience

- Category: **Travel & Local**
- Target audience: **18+** (bookings create a binding contract)
- No ads, no user-generated content feeds, no gambling, no violence.
- Contains in-app purchases? **No.** No payment is taken in the app at all; travel services
  are paid off-app and are exempt from Google Play Billing.

## 4. Store listing copy

Copy must match `docs/product-truth.md`: request-to-book, human confirmation, no live fares.

**App name:** Trips.bd — Hotels & Flights

**Short description (80 chars):**
Request hotels, flights, activities and transfers across Bangladesh in one app.

**Full description:**
Trips.bd is Bangladesh's all-in-one travel app. Browse hotels, homes and apartments, domestic and
international flights, airport transfers and local activities, then send a booking request — our
team confirms availability and sends you a payment link. Everything is priced in BDT.

- Browse hotels and homes across Dhaka, Cox's Bazar, Sylhet, Chattogram and beyond
- One-way and return flight search with cheapest and fastest options highlighted
- Flight + hotel bundles
- Track every request in My Trips with live status updates as our team confirms it
- Deals and promo codes
- Save listings for later and get notified when your request status changes

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

