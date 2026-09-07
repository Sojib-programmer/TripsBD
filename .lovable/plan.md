# Trips.bd — Google Play submission readiness

Decisions locked: operator is Marketsync Global Ltd (Rajshahi); V1 ships stays, flights,
activities and transfers; seeded catalogue is hidden until real inventory exists; the unused
review/payment tables are dropped.

Everything below that lives in this project I will do. Four items can only be done by you on a
workstation and in Play Console — they are listed at the end and they are the real gate.

## 1. Real business identity everywhere

Publish, verbatim, in `/support`, `/privacy`, `/terms`, `/account/delete`, the footer and the
listing pack:

```text
Marketsync Global Ltd.
Reg. No RAJC-2483/2025 · TIN 317774303960 · Trade Licence 01/13-2665
Kashidanga City Gate, Rajpara, Rajshahi-6201, Bangladesh
Incorporated under the Companies Act, 1994 (Act XVIII of 1994)
Phone +8801540723530 · support@trips.bd · privacy@trips.bd
```

Remove every trace of the old Dhaka address. The CI placeholder check gets the new strings.

## 2. Scope reduction to four verticals

Cars, eSIM, trains and packages leave the product surface: home tiles, search, bottom nav,
sitemap and store copy. Their routes redirect to home rather than 404, and the code stays in
place so they can be switched back on. `docs/product-truth.md` records the four-vertical scope.

## 3. Honest inventory

A single `INVENTORY_LIVE` gate makes the catalogue queries return nothing until real contracted
rows exist. Each vertical then shows a purposeful empty state — "Tell us what you need and we
will source it" — leading to the existing request form with the destination/date/traveller
fields the user already picked. Every request still lands in `orders`, so Trips, notifications
and status flow work identically. This keeps the app functional for Play review while claiming
nothing false.

## 4. Truthful booking lifecycle

- Cancellation: the traveller can cancel a `pending` or `confirmed` request from Trips and the
  order/booking detail page; a guarded server function writes the status change and event, and
  the trigger set already blocks financial tampering.
- Status vocabulary aligned end to end: requested → in review → confirmed → cancelled/completed.
- Copy audit removes anything implying live fares, instant confirmation or in-app payment;
  the cancellation/refund policy shown matches `/terms`.

## 5. Database and deletion hardening

- Verify against the live schema, then drop `payment_transactions`, `reviews`,
  `review_helpfulness` and `cancellation_policies` if they exist unused.
- RLS negative tests as an automated suite: anon and a second signed-in user must fail to read
  or write another user's profile, orders, bookings, saved listings and notifications.
- Account deletion made idempotent and safe to retry, deleting auth user last, with the
  retained-financial-record archive unchanged. Tally support submissions are not in our
  database, so `/account/delete` and `/privacy` state plainly that support messages sent through
  the form are held by our forms processor and deleted on request to privacy@trips.bd — or the
  form is replaced with a Supabase-backed one so deletion is genuinely end-to-end. I will
  replace it; that is the only version that survives review.

## 6. Legal and Data Safety pack

Rewrite `/privacy`, `/terms`, `/support`, `/account/delete` and refresh `docs/product-truth.md`,
`docs/play-store.md`, `docs/play-listing.md` so the Data Safety matrix is row-per-data-type with
the exact table and code path: account details, contact details, booking details, saved items,
notifications, sign-in identity (Google/Apple/email), error reports, retention periods and the
six-year anonymised financial retention exception.

## 7. Release gates in CI

Extend `.github/workflows/release-gates.yml`: build + typecheck + lint, no fake contact strings,
no forbidden booking claims, no asset-links placeholders, exact image dimensions, legal routes
returning 200, RLS negative tests, an account-deletion end-to-end test, and a manifest
content-type check.

## 8. What only you can do (the actual blockers)

1. Build the AAB on a workstation with JDK 17 + Android SDK: `bubblewrap init/build`, package
   `bd.trips.app`, compile/target SDK 36, min 23, portrait, cleartext off, autoVerify on, R8 on,
   keep `mapping.txt`. Enrol in Play App Signing at first upload.
2. Paste the upload-key and Play App Signing SHA-256 fingerprints into
   `public/.well-known/assetlinks.json`, redeploy, then install the signed APK on a physical
   device and confirm no URL bar.
3. Play Console: create the app, upload AAB + mapping, paste the listing pack, Data Safety,
   content rating, 18+, no ads, no IAP, reviewer test account, privacy and deletion URLs.
4. Internal → closed testing (12 testers for 14 days if this is a newer personal developer
   account) → clean pre-launch report → staged production rollout.

I cannot generate a signed Android bundle or operate Play Console from here; steps 1–7 make
everything they depend on green.
