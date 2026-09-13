# Trips.bd — Google Play readiness execution plan

Scope frozen: V1 = stays, flights, activities, airport transfers. Cars, eSIM, trains, packages stay `ComingSoon`. Request-to-book, no live inventory, no in-app payment. Operator Marketsync Global Ltd. Package `bd.trips.app`, host `app.trips.bd`, compile/target SDK 36, min 23.

Verified against the working tree this turn: `package.json` has `typecheck`/`lint`/`test`; `@sentry/react` installed and `src/lib/monitoring.ts` is the only Sentry consumer; `tests/rls/{anonymous,cross-user}-access.test.ts` + `tests/monitoring/scrub.test.ts` exist; `public/manifest.webmanifest` name `Trips.bd: Hotels & Flights` matches `android/twa-manifest.json`, description lists only V1 verticals; `public/.well-known/assetlinks.json` holds both `REPLACE_WITH_*` fingerprints; `android/` contains only `README.md` + `twa-manifest.json`; `release-gates.yml` enforces 10 gates; `docs/launch-gates.md` marks 3 and 10 Done while `docs/play-listing.md` §5 still lists them as blocking — a real doc inconsistency.

Ownership: **[A] Lovable in-repo**, **[B] user on a local Android workstation**, **[C] user in Play Console**.

---

## Phase 1 — Final production-web audit · P0 · [A]

Files: `public/manifest.webmanifest`, `public/.well-known/assetlinks.json`, `public/robots.txt`, `public/store/*`, `public/icons/*`, `src/routes/{index,privacy,terms,support,account.delete}.tsx`, `src/lib/company.ts`, `src/lib/inventory.ts`, `docs/play-listing.md`, `docs/launch-gates.md`.

Lovable does: headless pass over every public route signed out (200 + correct content type, including `manifest.webmanifest` as JSON-ish, `assetlinks.json` as `application/json`, icons as `image/png`); fetch the same paths on `https://app.trips.bd` to confirm the published build matches the repo; grep for stale contacts, out-of-scope verticals and instant-booking claims; confirm no route renders seeded catalogue rows while `INVENTORY_LIVE` is unset; rewrite `docs/play-listing.md` §5 so gate statuses agree with `docs/launch-gates.md` (gates 3 and 10 are Done; remaining blockers are 2, 6, 7, 9, 12 and the Console items).

Inputs: confirmation that `support@trips.bd` and `privacy@trips.bd` are monitored mailboxes; D-U-N-S number if the Play account is an organisation.

Acceptance: every public route 200 signed out on both preview and `app.trips.bd`; zero grep hits for stale contacts/claims; listing and gate docs state identical statuses.
Verify: route smoke script under `/tmp/browser/`, `curl -sI` per asset, `rg` guards, `release-gates.yml` green.
Depends on: nothing. Status now: **RED** (doc inconsistency; published-build parity unverified).

## Phase 2 — Auth, deletion, security · P0 · [A] + [C]

Files: `src/lib/auth.ts`, `src/routes/auth.tsx`, `src/integrations/supabase/{client,auth-middleware,auth-attacher}.ts`, `src/lib/{compliance,account,orders,cancellation}.functions.ts`, `src/lib/deletion.server.ts`, `tests/rls/*`, `supabase/migrations/*`.

Lovable does: read the three sign-in paths and confirm `redirectTo` resolves to the production origin inside a TWA (not a preview host); re-run `tests/rls/anonymous-access.test.ts`; audit that no client-reachable policy or RPC permits changing `user_id`, `total_bdt`, `status` or any financial column (confirm the UPDATE triggers still pin them); verify account deletion end to end including `support_messages` removal, `deletion_audit`/`retained_financial_records` retention, and that `/account/delete` is reachable signed out; fix only findings that block release.

Inputs from user: Supabase dashboard — Google and Apple providers enabled, with `https://app.trips.bd/**` and the preview origin in the allowed redirect list (external project, no agent tool); two throwaway accounts as `RLS_TEST_USER_A_EMAIL/PASSWORD` and `RLS_TEST_USER_B_EMAIL/PASSWORD` secrets, otherwise the cross-user suite stays skipped.

Acceptance: anonymous RLS suite green; cross-user suite green once credentials exist; deletion verified against the database; no writable ownership/price/status path.
Verify: `bun run test`, targeted `supabase--read_query` policy checks, a signed-out fetch of `/account/delete`.
Depends on: user provider config. Status now: **RED** (providers unconfirmed, cross-user tests skipped).

## Phase 3 — Monitoring and reliability · P0/P1 · [A]

Files: `src/lib/monitoring.ts`, `src/lib/error-capture.ts`, `src/routes/__root.tsx`, `tests/monitoring/scrub.test.ts`, `.github/workflows/ci.yml`.

Lovable does: confirm Sentry initialises only when the DSN exists, tags release `trips-bd@<appVersionName>` matching `android/twa-manifest.json`, and scrubs emails/phones/tokens; extend the scrub unit test with a PII-bearing smoke payload; add a documented one-shot smoke path that proves an event lands without PII; run typecheck, lint, tests and a production build, plus a route smoke pass; confirm each CI step is release-blocking (non-zero exit fails the job).

Inputs: **exactly one secret** — `VITE_SENTRY_DSN`. Nothing else is required for monitoring.

Acceptance: DSN absent → no crash, monitoring inert; DSN present → tagged, scrubbed event visible; CI red on any failure.
Verify: `bun run typecheck && bun run lint && bun run test && bun run build`.
Depends on: user supplying the DSN for the live proof. Status now: **RED** (DSN unset, smoke unproven).

## Phase 4 — Data Safety and legal evidence · P0 · [A] writes, [C] submits

Files: `docs/play-store.md` §2, `docs/product-truth.md`, `src/routes/privacy.tsx`, `src/routes/terms.tsx`, `src/integrations/supabase/types.ts`, `supabase/migrations/*`.

Lovable does: re-derive the Data Safety table from the current schema so every row cites a table/column — account data, user IDs, contact data, order/booking details, support free text, crash diagnostics, processors (Supabase, Google, Apple, Cloudflare/Lovable hosting, Sentry, Tally if any form still collects data), retention and deletion; reconcile it line for line with the privacy UI and product-truth doc; write reviewer-facing deletion and privacy instructions in the exact wording the reviewer will follow.

Inputs: none beyond Phase 1 mailbox confirmation.
Acceptance: no Data Safety row without a code/table citation; privacy page and doc agree sentence by sentence.
Verify: schema query per declared row; diff doc vs `/privacy` copy.
Depends on: Phase 2 deletion audit. Status now: **AMBER** (table exists, needs re-derivation against the latest schema).

## Phase 5 — TWA/web compatibility and reviewer path · P0 · [A] prepares, [B]/[C] execute

Files: `public/manifest.webmanifest`, `android/twa-manifest.json`, `src/routes/__root.tsx`, `src/components/AppShell.tsx`, `src/hooks/useAuth.ts`, `docs/play-store.md`.

Lovable does: confirm `start_url` `/?source=pwa` and scope `/` are inside the verified origin, all in-app links stay in scope, OAuth returns land back in scope, expired sessions recover without a dead screen, back navigation exits only at root, layout holds portrait at 360dp, and network failures render a retry state rather than a blank page; write the reviewer script — sign in, submit a request in each V1 vertical, read the reference, open Trips, see status, cancel, contact support, delete the account — and state plainly that confirmation is human and no payment is taken, so the app is not a thin wrapper.

Inputs: none for preparation; on-device execution is [B].
Acceptance: every checked behaviour observed in a headless mobile viewport; reviewer script reproducible step by step.
Verify: Playwright pass at 360×800 with offline simulation.
Depends on: Phase 1. Status now: **AMBER**.

## Phase 6 — Assetlinks handoff · P0 · [B] then [A]

File: `public/.well-known/assetlinks.json` (single change).

After the user sends the two SHA-256 fingerprints — upload key from `keytool -list -v -keystore android.keystore -alias android`, and Play App Signing from Play Console → Setup → App integrity — Lovable replaces `REPLACE_WITH_UPLOAD_KEY_SHA256_FINGERPRINT` and `REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FINGERPRINT` with those literals, keeps `package_name: bd.trips.app`, and publishes so the file serves live. No fingerprint will be invented, and the release-gates job stays red until both are real — that redness is the intended blocker signal.

Acceptance: `https://app.trips.bd/.well-known/assetlinks.json` returns 200 `application/json` with both fingerprints; installed TWA shows no URL bar.
Depends on: the keystore existing. Status now: **RED**.

---

## User-only tasks

**[B] Local Android workstation:** install JDK 17, Android SDK, `@bubblewrap/cli`; `bubblewrap init --manifest=https://app.trips.bd/manifest.webmanifest`; generate the Gradle project; create and escrow the signing keystore (record custody in `docs/launch-gates.md`); `bubblewrap build` for the signed AAB, a signed APK for device testing, and the R8 mapping file; run the on-device QA pass (Google/Apple/email sign-in, all four verticals request→cancel, notifications, deletion, back gesture, offline states); obtain the upload-key SHA-256.

**[C] Play Console:** developer identity verification; create the app; enroll in Play App Signing and read the Play App Signing SHA-256; upload AAB + mapping; store listing from `docs/play-listing.md`; Data Safety from `docs/play-store.md` §2; content rating questionnaire; App access reviewer account; Internal testing, then closed testing (14-day requirement applies to personal accounts); pre-launch report review; production submission and staged rollout.

## Current blocker list

1. `assetlinks.json` placeholders — no keystore exists yet. [B]→[A]
2. No Gradle project, keystore, AAB, APK or mapping file. [B]
3. Google/Apple providers unconfirmed in the external Supabase project. [C-equivalent, user]
4. `VITE_SENTRY_DSN` unset; monitoring smoke unproven. user→[A]
5. Cross-user RLS suite skipped — no test credentials. user→[A]
6. `docs/play-listing.md` §5 contradicts `docs/launch-gates.md`. [A]
7. Published-build parity on `app.trips.bd` unverified this turn. [A]
8. On-device QA, Data Safety submission, reviewer account, testing tracks, pre-launch report. [B]/[C]

## Shortest path to Internal testing

```text
[A] Phase 1 audit + doc reconcile + Phase 3/5 verification  ->  publish
[B] bubblewrap init/build, keystore, signed AAB, upload-key SHA-256
[C] create app, enroll Play App Signing, upload AAB -> read second SHA-256
[A] patch assetlinks.json with both fingerprints -> publish
[B] install internal-testing build, confirm no URL bar, run QA script
[C] Data Safety + content rating + App access -> Internal testing live
```

## First Lovable batch after approval

Phase 1 in full (route/asset/published-parity audit and the `play-listing.md` §5 reconcile), plus the Phase 3 verification chain — typecheck, lint, tests, production build, 360dp route smoke — and the Phase 5 TWA behaviour checks. That is everything in-repo that does not wait on a secret, a keystore or a Supabase dashboard toggle, and it leaves only the fingerprint paste before an upload-ready state.
