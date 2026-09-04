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

Paste that SHA-256 into `public/.well-known/assetlinks.json`, **and** after upload paste the
**Play App Signing** SHA-256 from Play Console → Setup → App integrity. Both fingerprints must be
live before release, otherwise the app shows a browser URL bar (a Play quality failure).

## 2. Data safety declaration

Collected, linked to the user, **not** shared with third parties for ads:

| Data type | Collected | Purpose | Optional |
| --- | --- | --- | --- |
| Email address | Yes | Account management, transactional email | No |
| Name, phone | Yes | Booking fulfilment | Yes |
| App interactions (searches, bookings) | Yes | App functionality, support | No |
| Crash logs / diagnostics | Yes | Analytics, stability | No |
| Purchase history (booking orders) | Yes | App functionality | No |

Answers to the standard questions:

- Is all data encrypted in transit? **Yes** (HTTPS/TLS everywhere).
- Can users request data deletion? **Yes** — `https://app.trips.bd/account/delete`.
- Do you collect precise location, contacts, photos, SMS, health or financial account numbers?
  **No.**
- Do you share data with third parties? Only with the travel supplier fulfilling a booking and with
  processors (Supabase, Tally, Google/Apple sign-in) — declared as processing, not sharing.

## 3. Content rating & audience

- Category: **Travel & Local**
- Target audience: **18+** (bookings require a binding contract)
- No ads, no user-generated content feeds, no gambling, no violence → expected rating **Everyone /
  PEGI 3**, but the app is age-gated to 18+ in the terms.
- Contains in-app purchases? **No** in the Play billing sense — payments are for real-world travel
  services, which Play policy exempts from Google Play Billing.

## 4. Store listing copy

**App name:** Trips.bd — Hotels & Flights

**Short description (80 chars):**
Book hotels, flights, trains, cars, transfers, activities and eSIM in Bangladesh.

**Full description:**
Trips.bd is Bangladesh's all-in-one travel app. Search and book hotels, homes and apartments,
domestic and international flights, intercity trains, airport transfers, car rentals with or
without a driver, attractions and experiences, and travel eSIM data plans — all in one place, all
priced in BDT.

- Compare hotels and homes across Dhaka, Cox's Bazar, Sylhet, Chattogram and beyond
- One-way and return flight search with cheapest and fastest results highlighted
- Flight + hotel bundles that save more than booking separately
- Track every booking in My Trips with live status updates
- VIP member prices, deals and promo codes
- Save listings for later and get notified when your booking status changes

## 5. Pre-launch checklist

- [ ] Both SHA-256 fingerprints present in `assetlinks.json` and deployed
- [ ] `https://app.trips.bd/.well-known/assetlinks.json` returns 200 with `Content-Type: application/json`
- [ ] Privacy policy URL reachable while signed out
- [ ] Deletion URL reachable while signed out
- [ ] Screenshots at least 1080px on the shortest side, 2–8 per form factor
- [ ] App icon 512×512 PNG, feature graphic exactly 1024×500
- [ ] Data safety form matches the table above
- [ ] Test the AAB on internal testing and confirm no URL bar appears
