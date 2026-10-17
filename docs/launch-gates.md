# Trips.bd — production release gates

Production rollout on Google Play is **blocked** while any gate below is unmet.
Do not describe the app as production-ready until every gate is checked with evidence.

**Last web audit: 14 Sep 2026.** All public routes 200 signed out on the preview host and on
`https://app.trips.bd` with correct content types; the published `manifest.webmanifest` matches
the repo; no stale contacts, no instant-booking copy, `INVENTORY_LIVE` unset, four ComingSoon
verticals intact; every route clean at 360×800 with zero console errors; `typecheck`, `lint`,
`test` (47 passed, 6 cross-user tests skipped) and `build` green. Reviewer script and this
evidence are recorded in `docs/play-store.md` §6.

| # | Gate | Owner | Status (VERIFIED / BLOCKED / NOT VERIFIED) |
| --- | --- | --- | --- |
| 1 | Real contact info, address, phone | Lovable + Ops | VERIFIED in repo — `src/lib/company.ts`; mailbox monitoring NOT VERIFIED |
| 2 | `assetlinks.json` real SHA-256 fingerprints (upload + Play App Signing), live, no URL bar | Android + Ops | BLOCKED — placeholders in `public/.well-known/assetlinks.json` |
| 3 | Account deletion end-to-end | Lovable | NOT VERIFIED live — code fails closed on every step (`tests/deletion/*`); needs `DELETION_PSEUDONYM_SALT` secret (≥32 chars) or deletion is refused; no live deletion run |
| 4 | Data Safety matches code | Ops | NOT VERIFIED in Console — draft in `docs/play-store.md` §2 now declares Purchase history (EPS metadata); not submitted |
| 5 | Privacy/Terms truthful, reachable signed out | Lovable + Legal | VERIFIED in repo (`tests/disclosure/contradictions.test.ts`); legal sign-off NOT VERIFIED; production parity requires publish |
| 6 | Signed AAB, targetSdk 36, R8 mapping, key custody + backup | Android | BLOCKED — workstation only |
| 7 | Email sign-in inside TWA on physical device (Google/Apple removed) | Android + Ops | BLOCKED — needs device |
| 8 | Request → confirm → pay → Trips → cancel/refund | Lovable + QA | NOT VERIFIED live — no staff sign-in or live EPS payment executed |
| 9 | Live crash monitoring + pre-launch report | QA | BLOCKED — `VITE_SENTRY_DSN` missing |
| 10 | No instant/live claims; no demo inventory as real | Lovable | VERIFIED in repo — `INVENTORY_LIVE` gate + disclosure test |
| 11 | RLS tests + security/dependency scans | Lovable | PARTIAL — anonymous RLS tests pass; cross-user BLOCKED (no test accounts); dependency advisories open (see audit) |
| 12 | Reviewer account in App access | Ops | BLOCKED — account not created |
| 13 | EPS live payment + manual refund recorded | Ops | NOT VERIFIED — code reviewed; no real transaction run |
| 14 | Content rating, store assets final | Ops | NOT VERIFIED in Console — assets present in `public/store/` |

## Inputs required from the business before further work

1. Which verticals are operationally fulfillable at launch (scope freeze).
2. Registered legal entity name, address, phone, and monitored support/privacy mailboxes.
3. Confirmation that `bd.trips.app` is final, and who holds custody of the signing key.
4. Whether a payment gateway (bKash / SSLCOMMERZ) is in V1 scope, or strictly request-to-book.

## Continuous enforcement

`.github/workflows/ci.yml` runs typecheck, lint, tests and a production build on every push.
`.github/workflows/release-gates.yml` fails the build on: placeholder asset-link fingerprints,
placeholder contact details, instant/live-booking copy, a missing or bypassed inventory gate,
out-of-scope verticals that are not `ComingSoon`, a manifest that advertises a vertical outside
V1 scope, an app-name mismatch between the web manifest, `android/twa-manifest.json` and
`docs/play-listing.md`, `INVENTORY_LIVE=true` committed anywhere, removal of real account
deletion, and wrong store-asset dimensions.

## Signing key custody — REQUIRED BEFORE GATE 6

Record before the first upload: who generates `android.keystore`, where the file is stored,
where the keystore/key passwords are escrowed, and who the backup holder is. Losing this key
means the app can never be updated under `bd.trips.app`.
