# Trips.bd — Google Play submission remediation plan

Scope freeze: V1 ships **stays, flights, activities, airport transfers**, request-to-book only, no live inventory, no in-app payment. Cars, eSIM, trains, packages stay `ComingSoon`. No product redesign, no new features.

Verified current state (this turn): `public/manifest.webmanifest` description still lists trains, airport transfers, car rentals and eSIM and its `name` is "Trips.bd — Hotels, Flights & Activities" while `android/twa-manifest.json` says "Trips.bd — Hotels & Flights"; `public/.well-known/assetlinks.json` holds both `REPLACE_WITH_*` fingerprints; `.github/workflows/release-gates.yml` already checks assetlinks placeholders, contact placeholders, instant-booking copy, the inventory gate, ComingSoon verticals, deletion and store-asset dimensions; `.github/workflows/webpack.yml` still runs npm+webpack; `package.json` has no test or typecheck script and no vitest; `src/lib/inventory.ts` reads `INVENTORY_LIVE` / `VITE_INVENTORY_LIVE`; `src/lib/lovable-error-reporting.ts` + `error-capture.ts` are the only error capture, no Sentry in `src/`.

---

## Phase 0 — Repo truth alignment (P0, Lovable, ~1 batch)

Files: `public/manifest.webmanifest`, `docs/play-listing.md`, `docs/play-store.md`, `docs/launch-gates.md`.

- Standardize app name to **"Trips.bd: Hotels & Flights"** in the web manifest `name`, `android/twa-manifest.json` `name`, and both docs. `short_name` / `launcherName` stay "Trips.bd" (launcher label ≤12 chars).
- Rewrite manifest `description` to launch scope only: hotels & homes, flights, activities, airport transfers, request-to-book. Drop trains / car rentals / eSIM.
- Trim manifest `categories` and screenshot labels so no label implies instant booking.
- Update `docs/play-store.md` §4 and `docs/play-listing.md` to the single canonical name and description.

Acceptance: no occurrence of `trains|car rental|eSIM` in `public/manifest.webmanifest`; `name` identical across manifest, TWA manifest, and both docs.
Verify: `rg -n "eSIM|car rental|trains" public/manifest.webmanifest docs/` returns nothing; new CI gate (Phase 1) passes.

## Phase 1 — CI that actually protects the release (P0, Lovable)

Files: delete `.github/workflows/webpack.yml`; new `.github/workflows/ci.yml`; extend `.github/workflows/release-gates.yml`; add `test`/`typecheck` scripts to `package.json`.

- `ci.yml`: `oven-sh/setup-bun`, `bun install --frozen-lockfile`, `bun run typecheck` (tsgo/tsc `--noEmit`), `bun run lint`, `bun run build`, `bun run test`.
- New gates appended to `release-gates.yml`:
  1. **Stale manifest claims** — fail if manifest description or listing docs mention out-of-scope verticals.
  2. **Name consistency** — manifest `name` must equal TWA manifest `name`.
  3. **Inventory flag** — fail if any committed file sets `INVENTORY_LIVE=true` or `VITE_INVENTORY_LIVE=true` (`.env*`, workflow env, `wrangler`/vite config).
  4. Keep and re-verify the existing placeholder-fingerprint, contact, instant-booking, ComingSoon, deletion and asset-dimension gates.

Acceptance: `ci.yml` green on a clean checkout; each new gate proven by a deliberate local failing grep before committing the fix.
Dependency: Phase 0 must land first or the manifest gate fails by design.

## Phase 2 — Data Safety, code-backed (P0, Lovable writes doc; user submits)

Files: `docs/play-store.md` §2, `docs/product-truth.md`, `src/routes/privacy.tsx`.

Do a code pass over `src/lib/*.functions.ts`, `src/lib/deletion.server.ts`, `supabase/migrations/*`, `src/integrations/supabase/types.ts` and produce a table where every declared row names the exact table/column, plus:

- **User IDs** — `auth.users.id`, `profiles.id`, `orders.user_id` (currently undeclared; must be declared).
- **Search history** — confirm whether search params are persisted or logged anywhere; declare "App interactions" only for what is actually stored (`saved_listings`, `orders`, `bookings`), and state explicitly in the doc that searches are not persisted if the code pass confirms that.
- **Free-text content** — `support_messages`, order notes/special-requests fields.
- **Crash/diagnostic** — `src/lib/error-capture.ts` + `lovable-error-reporting.ts`; declare what is transmitted and where.
- **Purchase/transaction history** — no payment in app, but retained anonymized financial records from deletion must appear under retention, not under "purchase history collected".
- **Deletion & retention** — deletion request/audit rows retained after account deletion, with stated retention period.
- **Third-party processors** — Supabase, Google/Apple sign-in, hosting/CDN, error reporting; declared as processing, not sharing.

Acceptance: every Data Safety row cites a file/table; privacy policy text and doc table agree line for line.
Outside Lovable: submitting the declaration in Play Console.

## Phase 3 — RLS negative test suite (P1, Lovable)

Files: new `tests/rls/*.test.ts`, `vitest.config.ts`, `package.json` test script; wired into `ci.yml`.

Anonymous and cross-user clients must be denied: read another user's `orders`/`bookings`/`profiles`/`saved_listings`/`notifications`/`support_messages`; insert an order for another `user_id`; mutate `status`/price fields on own order (protection triggers); escalate via `user_roles`. Positive control: own rows readable.

Acceptance: suite red when a policy is removed locally, green on current schema; runs in CI against a test Supabase project with anon key only (no service-role key in CI).
Dependency: needs a CI-safe Supabase target and seeded test users — flag if the user prefers running this locally instead.

## Phase 4 — Crash/error monitoring (P1, Lovable + user)

Files: `src/lib/error-capture.ts`, `src/routes/__root.tsx`, `src/lib/monitoring.ts` (new).

Route client and server-function errors into the existing Sentry connection with release/version tagging matching `appVersionName`, sampled, PII-scrubbed (no emails, phones, tokens in breadcrumbs). Add a documented smoke path to prove an event lands.

Acceptance: a deliberate test error appears in Sentry tagged with the release; no PII in the payload.
Outside Lovable: DSN/secret if not already present.

## Phase 5 — Signed AAB (P0, user only, local workstation)

Not executable in Lovable. On JDK 17 + Android SDK, per `docs/play-store.md` §1 and `android/README.md`:

`bubblewrap init --manifest=https://app.trips.bd/manifest.webmanifest` (after Phase 0 is published) → `bubblewrap build` → keystore + `app-release-bundle.aab` + mapping file. Record signing-key custody (who holds `android.keystore`, where the password is escrowed) in `docs/launch-gates.md` gate 6.

Acceptance: AAB installs on a device; `targetSdk`/`compileSdk` 36, `minSdk` 23; R8 mapping produced.
Blocks: Phase 6, 7, 8.

## Phase 6 — Digital Asset Links (P0, split)

1. User: `keytool -list -v -keystore android.keystore -alias android` → upload-key SHA-256.
2. User: upload the AAB to Internal testing → Play Console → Setup → App integrity → Play App Signing SHA-256.
3. Lovable: paste both into `public/.well-known/assetlinks.json`.
4. User: **publish** so `https://app.trips.bd/.well-known/assetlinks.json` serves live.

Acceptance: URL returns 200 with `application/json` and both fingerprints; installed TWA opens with **no URL bar**.
Note: the existing CI gate fails the build while placeholders remain — this is intentional and is the release blocker signal.

## Phase 7 — On-device QA (P0, user; Lovable fixes findings)

Inside the signed TWA on a physical Android device: Google sign-in, Apple sign-in, email/password sign-in and sign-out; full request → confirmation → Trips → cancel for each of the four launch verticals; notifications list; account deletion end to end; back-gesture behaviour; offline/error states; portrait lock. Capture screenshots/recording as evidence for gates 7 and 8.

Acceptance: all flows pass on a real device; each failure filed and fixed in-repo before re-build.

## Phase 8 — Play Console declarations & rollout (P0, user only)

Data Safety (Phase 2 table), content rating questionnaire (Travel & Local, 18+, no IAP, no ads), App access reviewer account with credentials and a scripted walkthrough, store listing upload (name, short/full description, icon, feature graphic, 4 screenshots), Internal testing → review pre-launch report → closed testing if any policy or stability flag appears → staged production rollout (start 20%).

Acceptance: pre-launch report shows zero P0 crashes/ANRs; no policy warnings; review passed.

---

## Sequence

```text
Phase 0 -> Phase 1 -> publish
        \-> Phase 2, 3, 4 (parallel, Lovable)
publish -> Phase 5 (user) -> Phase 6 -> Phase 7 -> Phase 8
```

## Release gate checklist (GREEN requires the named evidence)

| # | Gate | GREEN evidence | Owner |
| --- | --- | --- | --- |
| 1 | Contact/legal details real | CI contact gate green | Lovable |
| 2 | assetlinks live, no URL bar | 200 JSON with both SHA-256 + device screenshot | User |
| 3 | Deletion fulfilled | CI gate + device run screenshot | Both |
| 4 | Data Safety matches code | doc table with file/table citations + Console screenshot | Both |
| 5 | Privacy/Terms reachable signed out | anonymous 200 on /privacy, /terms, /account/delete | Lovable |
| 6 | Signed AAB, targetSdk 36, mapping uploaded | Console release page + key custody note | User |
| 7 | Google/Apple/email auth in TWA | device recording per provider | User |
| 8 | Four verticals request→cancel | device evidence per vertical | User |
| 9 | Zero P0 crashes; monitoring live | pre-launch report + Sentry event | Both |
| 10 | No live/instant claims, no demo inventory | CI copy + inventory gates green | Lovable |
| 11 | RLS negative tests + scans clean | CI test run + scan output | Lovable |
| 12 | Reviewer account documented | Console App access screenshot | User |

RED = any missing artifact above. Do not roll out to production with any RED.

## Technical notes

- `INVENTORY_LIVE` is server-side; `VITE_INVENTORY_LIVE` is the client twin — both must stay unset until real supplier inventory exists; the new CI gate enforces this.
- `bubblewrap init` reads the **live** manifest, so Phase 0 must be published before Phase 5 or the AAB carries the stale name/description.
- `package.json` currently has no test or typecheck script; Phase 1 adds both, and Phase 3 depends on them.

## Recommended first batch after approval

Phases 0 + 1 together: fix the manifest name/description, standardize the app name across TWA config and docs, delete `webpack.yml`, add a real Bun CI workflow with typecheck/lint/build, and add the three new release gates. That is the whole in-repo blocker set for producing a correct AAB, and it unblocks the user's local Bubblewrap build immediately. Phase 2 (Data Safety code pass) follows in the next batch.
