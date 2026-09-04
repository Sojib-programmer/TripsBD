# Trips.bd — production release gates

Production rollout on Google Play is **blocked** while any gate below is unmet.
Do not describe the app as production-ready until every gate is checked with evidence.

| # | Gate | Owner | Status |
| --- | --- | --- | --- |
| 1 | No placeholder contact info, address or phone in app or listing | Lovable + Ops | Partially done — fake phone/address removed from `/support`; real registered entity details still required |
| 2 | `assetlinks.json` has both real SHA-256 fingerprints, is live, and the release build shows no URL bar | Android + Ops | **Blocked** — placeholders in `public/.well-known/assetlinks.json` |
| 3 | Account deletion actually deletes data end-to-end within the disclosed SLA | Lovable | **Blocked** — `compliance.functions.ts` only queues a `deletion_requests` row |
| 4 | Data Safety declaration matches `docs/product-truth.md` line for line | Ops | Pending |
| 5 | Privacy policy and Terms truthful and reachable signed out | Lovable + Legal | Pending truth pass |
| 6 | `targetSdk` 36, release-signed AAB, mapping uploaded | Android | **Blocked** — no Android project |
| 7 | Google, Apple and email sign-in verified inside the TWA on a physical device | Android + Ops | Pending |
| 8 | Every shipped vertical completes request → confirmation → Trips → cancellation | Lovable + QA | Pending (cancellation not implemented) |
| 9 | Zero P0 crashes/ANRs in the Play pre-launch report; error monitoring live | QA | Pending |
| 10 | No live/instant-booking claims; no demo inventory presented as real | Lovable + Ops | Copy pass done; seeded inventory still presented as real — **blocked** |
| 11 | RLS negative tests green; security and dependency scans clean | Lovable | Pending |
| 12 | Reviewer test account documented in Play Console → App access | Ops | Pending |

## Inputs required from the business before further work

1. Which verticals are operationally fulfillable at launch (scope freeze).
2. Registered legal entity name, address, phone, and monitored support/privacy mailboxes.
3. Confirmation that `bd.trips.app` is final, and who holds custody of the signing key.
4. Whether a payment gateway (bKash / SSLCOMMERZ) is in V1 scope, or strictly request-to-book.
