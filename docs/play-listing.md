# Trips.bd — Play Console store listing pack

Copy/paste source for Play Console → Grow → Store presence → Main store listing.
All claims here are constrained by `docs/product-truth.md` (request-to-book, no live
fares, no in-app payment). Release remains gated by `docs/launch-gates.md`.

## 1. Listing text

**App name (30 chars max):** `Trips.bd: Hotels & Flights` (26)

**Short description (80 chars max):**
`Request hotels, flights, transfers & activities across Bangladesh in one app.` (77)

**Full description (4000 chars max):**

```
Trips.bd is Bangladesh's all-in-one travel app. Browse hotels, homes and apartments,
domestic and international flights, airport transfers, car rentals, trains, eSIM plans
and local activities — then send a booking request. Our team checks availability with
the supplier, confirms it with you, and sends a secure payment link. Everything is
priced in BDT.

HOW BOOKING WORKS
Trips.bd is a request-to-book service. You choose what you want and send a request; a
human confirms availability, usually within one business day. No payment is taken in
the app, and nothing is confirmed until we tell you it is.

WHAT YOU CAN DO
• Browse hotels, homes and apartments in Dhaka, Cox's Bazar, Sylhet, Chattogram and beyond
• Search one-way and return flights, with cheapest and fastest options highlighted
• Request airport transfers, car rentals, train seats, tours and activities
• Buy-ready eSIM data plans for travel
• Track every request in My Trips, with status updates as our team works on it
• Save listings for later and get notified when a request status changes
• Sign in with Google, Apple or email

PRICING AND PAYMENT
Prices shown are indicative and confirmed before payment. No payment is taken inside
the app; we send a payment link once availability is confirmed. There are no in-app
purchases and no subscription.

YOUR DATA
We collect your account details and the contact information needed to fulfil a booking.
You can delete your account and data at any time from app.trips.bd/account/delete.
Privacy policy: app.trips.bd/privacy · Terms: app.trips.bd/terms
```

Compliance check: contains no "instant book", "book instantly", "live fares", or
"real-time availability" — the strings blocked by `.github/workflows/release-gates.yml`.

## 2. Store settings

| Field | Value |
| --- | --- |
| App or game | App |
| Category | Travel & Local |
| Tags | Hotel booking, Flights, Trip planning |
| Contains ads | No |
| In-app purchases | No |
| Target audience | 18+ |
| Content rating questionnaire | No violence / no UGC feed / no gambling / no ads |

## 3. Store listing contact details — REQUIRED FROM THE BUSINESS

Play requires a support email, and a developer address (plus phone if you are declared
as a trader). These must be real, monitored, and match the registered entity — placeholder
values are a Policy → Developer information rejection, and CI blocks them.

| Field | Value | Status |
| --- | --- | --- |
| Support email | `support@trips.bd` | in use in the app — confirm the mailbox is monitored |
| Privacy contact | `privacy@trips.bd` | in use in the app — confirm the mailbox is monitored |
| Website | `https://app.trips.bd` | ready |
| Support phone | — | **missing** — supply the real registered number |
| Registered legal entity name | — | **missing** |
| Registered business address | — | **missing** |
| D-U-N-S number (org accounts) | — | **missing** |

Until the four missing rows are supplied, the listing cannot be completed. Nothing
fabricated will be written into the app or the docs.

## 4. Graphics assets — verified in repo

| Asset | Requirement | File | Verified |
| --- | --- | --- | --- |
| App icon | 512×512 PNG, 32-bit | `public/store/app-icon-512.png` | 512×512 ✅ |
| Feature graphic | 1024×500 PNG/JPG | `public/store/feature-graphic.png` | 1024×500 ✅ |
| Phone screenshots | 2–8, ≥1080px short side | `public/store/screenshot-{home,stays,flights,trips}.png` | 4 × 1080×1920 ✅ |
| Adaptive/maskable icon | 512×512 | `public/icons/icon-maskable-512.png` | 512×512 ✅ |

Dimensions are enforced on every push by `.github/workflows/release-gates.yml`.

## 5. Submission — what is still blocking

Submission cannot be performed from this project. It requires a signed Android artifact
and an authenticated Play Console session. Remaining work, in order:

1. Build the AAB on a workstation with JDK 17 + Android SDK, per `docs/play-store.md` §1
   (`bubblewrap init/build`, `targetSdk` 36, R8 on, mapping uploaded).
2. Paste the upload-key **and** Play App Signing SHA-256 fingerprints into
   `public/.well-known/assetlinks.json`, deploy, and confirm the TWA shows no URL bar.
3. Fulfil the outstanding gates in `docs/launch-gates.md` — in particular real account
   deletion (gate 3) and the seeded-inventory problem (gate 10).
4. Play Console → create app → paste §1 and §2 → upload §4 → Data safety per
   `docs/play-store.md` §2 → App access reviewer credentials → Internal testing →
   Production rollout.
