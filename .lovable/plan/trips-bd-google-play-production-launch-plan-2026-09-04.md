# Trips.bd — Google Play production launch plan

Target: ship `bd.trips.app` (TWA over https://app.trips.bd) to Play production with no false claims, no placeholder data, and no unmet policy gate.

## Current-state scorecard

| Area | State | Evidence in repo |
| --- | --- | --- |
| Web app + 8 verticals | Exists | `src/routes/{stays,flights,packages,activities,transfers,cars,esim,trains}.tsx` |
| Auth (email + Google/Apple UI) | Partial — provider config unverified in prod | `src/lib/auth.ts`, `src/routes/auth.tsx` |
| Orders/bookings + realtime | Exists | `orders`, `order_events`, `notifications`, `bookings` tables; `src/lib/orders.functions.ts` |
| Payments | Missing (request-to-book only) | `createOrder` inserts `total_bdt`, no gateway; `payment_transactions` table declared in an early migration but no runtime use |
| Inventory | Seeded/demo only | ~28 literal `insert into` seed blocks across migrations; no supplier API |
| Legal routes | Exists, truth unverified | `privacy.tsx`, `terms.tsx`, `account.delete.tsx` |
| Account deletion | Partial — queues a row only | `src/lib/compliance.functions.ts` inserts into `deletion_requests`; no fulfillment |
| Support contact | Blocker — fake | `src/routes/support.tsx`: `+880 1700 000000`, `Gulshan Avenue, Dhaka 1212` |
| PWA manifest/icons | Exists, sizes wrong | `icon-512.png` and `app-icon-512.png` are 816×816; `feature-graphic.png` is 1152×576, Play requires exactly 1024×500 |
| Service worker | Missing | manifest present, no `public/sw.js`, no registration |
| Digital Asset Links | Blocker — placeholders | `public/.well-known/assetlinks.json` has both fingerprints as `REPLACE_WITH_...` |
| Android project / AAB | Missing entirely | no Gradle, no Bubblewrap output |
| Docs | Misleading | `docs/play-store.md` opens claiming the app "is packaged" |
| CI | Effectively absent | only `.github/workflows/webpack.yml` (wrong stack) |
| Tests | Missing | no unit/E2E suite in repo |

## Architecture decision: TWA for V1

Ship TWA, not a native rewrite. Rationale specific to this project: the entire product is TanStack Start SSR + Supabase with server functions and route-level auth; a native client would need a duplicate API surface that does not exist today. There is no requirement in the shipped feature set that a TWA cannot serve — no camera, no background location, no offline-first booking, no Play Billing (real-world travel services are exempt). Push notifications are the only native-adjacent gap; solve with Web Push in the TWA (notification delegation) or defer to V1.1. Revisit native only if Play Billing or FCM-heavy engagement becomes core.

## Critical path

```text
P0-A Product truth pass ─┐
P0-B Real business identity ─┼─> P0-D Legal/Data-Safety truth ─┐
P0-C Deletion fulfillment ───┘                                 │
                                                               ├─> P1 Bubblewrap build (API 36) ─> Signing ─> assetlinks live ─> Internal track ─> Closed ─> Production
P0-E Backend integrity (state machine, idempotency, RLS)  ─────┤
P0-F Store assets exact-size + copy ───────────────────────────┘

Parallel anytime: performance, a11y, QA harness, monitoring, CI, service-worker decision.
```

Sequential hard dependencies: business identity → legal copy → Data Safety form; upload key → SHA-256 → assetlinks.json → publish → DAL verification → no-URL-bar test; deletion fulfillment → Data Safety "users can delete data" answer.

---

## Phase 0 — Product truth and scope freeze (P0)

Inspect/change: `docs/play-store.md`, `src/components/screens/HomeScreen.tsx`, all vertical routes, `src/components/CheckoutPanel.tsx`, `src/routes/order.$reference.tsx`, `src/routes/terms.tsx`.

- Classify every vertical as LIVE (request-to-book, human fulfilment) vs DEMO. Current reality: all eight are request-to-book against seeded inventory.
- Rewrite all UI/store copy to "request to book — we confirm within X hours". Remove any wording implying instant confirmation, live availability, or live fares. Explicitly audit the `book-flight`, `book.$slug`, checkout and confirmation screens for "confirmed"/"booked" language on a `pending` order.
- Decide launch scope. Recommended V1: Stays, Flights, Activities, Transfers as request-to-book; Cars/eSIM/Trains/Packages either behind an "Enquire" label or removed from the tile grid and store copy. Verticals that cannot be fulfilled operationally must not ship — a booking Play testers can place and never receive is a policy and review risk.
- Non-goals V1: card payments in-app, Play Billing, live supplier APIs, FCM push, tablet-optimised layouts, offline booking.
- Acceptance: a written vertical matrix in `docs/product-truth.md`; grep shows zero instant-booking claims; every shipped vertical has a named human fulfilment owner.

## Phase 1 — Production identity and configuration (P0)

Inspect/change: `src/routes/support.tsx`, `src/routes/privacy.tsx`, `src/routes/terms.tsx`, `.env`/Project Settings → Secrets, Supabase Auth settings.

- Replace the fake phone and address with the real registered entity, trade licence/BIN if applicable, monitored `support@`/`privacy@` mailboxes and a real phone. **Business ops task; the values must be supplied to Lovable.**
- Package ID `bd.trips.app` (matches manifest/docs, no repo contradiction). Immutable after first upload — confirm before any build.
- Confirm prod Supabase project, redirect allow-list (`https://app.trips.bd/*`, `android-app://bd.trips.app`), SMTP for auth mail, and that dev/prod secrets are separated. Audit `.env` values shipped to the client: only `VITE_*` publishable keys may be public.
- Acceptance: no placeholder contact string anywhere; auth emails deliver from a branded domain; secret scan clean.

## Phase 2 — Core user journeys hardening (P0/P1)

Inspect/change: `welcome.tsx`, `auth.tsx`, `search.tsx`, `listing.$slug.tsx`, `book.$slug.tsx`, `book-flight.tsx`, `order.$reference.tsx`, `booking.$reference.tsx`, `trips.tsx`, `saved.tsx`, `notifications.tsx`, `AppShell.tsx`, `CheckoutPanel.tsx`.

- For each journey define and implement: loading skeleton, empty state, error state with retry, offline state, and an unauthenticated path that preserves intent (deep-link back after login).
- Add user-initiated cancellation with policy text (there is a `cancellation_policies` table already) — Play reviewers test the reverse path.
- Notifications: confirm every `order_events` transition surfaces in `/notifications` and in Trips.
- Acceptance: scripted E2E walk of each journey on a throttled 3G emulator with zero dead ends and zero unhandled rejections in console.

## Phase 3 — Backend and data integrity (P0)

Inspect/change: all `supabase/migrations/*`, `src/lib/{orders,account,catalog,verticals,compliance}.functions.ts`, `src/integrations/supabase/auth-middleware.ts`.

- Order state machine: enumerate legal transitions (`pending → confirmed → completed`, `pending|confirmed → cancelled`, `→ failed`) and enforce in a trigger; reject illegal transitions server-side. Verify existing status-protection triggers cover the full matrix.
- Idempotency: accept a client-generated idempotency key on `createOrder` with a unique index, so double-tap and retry cannot create duplicate orders.
- Concurrency: for seat/slot-bound verticals (`activity_slots`, `flights`, `trains`) decrement capacity in a transaction with row locking, or explicitly document that capacity is advisory under request-to-book.
- Rate limiting/abuse: per-user and per-IP caps on order creation, deletion requests and support submissions.
- RLS verification: automated test that, as anon and as user B, every table denies reads/writes of user A rows. Verify grants exist for each public table.
- Deletion fulfillment: a privileged, audited routine that anonymises profile/contact fields, purges saved items, searches, notifications and support links, deletes the auth user, and retains only anonymised financial records — with an SLA timer and completion email. This is the Play gate, not the request row.
- Data separation: move demo seed inserts out of the production migration path or flag rows `is_demo` and hide them in prod; Play testers must not book fake hotels presented as real.
- Backup/recovery: confirm PITR on the prod Supabase project and document a restore drill.
- Acceptance: RLS test suite green; duplicate-submit test yields one order; a deletion request executes end-to-end in a staging account and the auth user is gone.

## Phase 4 — Authentication and security (P0)

- Google/Apple provider credentials live in prod; verify the OAuth redirect completes **inside** the TWA (Custom Tab) and returns to the app rather than a browser tab. Apple sign-in must work from Android.
- Session persistence across TWA cold start; token refresh after long background.
- Security review: dependency scan, CSP and security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS), XSS via any `dangerouslySetInnerHTML`, injection in the search/filter path, CSRF posture of server functions, and re-audit every privileged (`supabaseAdmin`) call path for caller verification.
- Acceptance: clean dependency + security scan; documented header set live on the production domain; OAuth round-trip recorded on a physical device.

## Phase 5 — Privacy and compliance (P0)

Inspect/change: `privacy.tsx`, `terms.tsx`, `support.tsx`, `ConsentNotice.tsx`, `docs/play-store.md`.

- Privacy truth pass: the policy must describe exactly what runtime code collects — auth email/name, profile phone, order contact details, saved items, notifications, error reports, and any analytics — plus the real processor list (Supabase, Tally, Google/Apple sign-in, error reporting, hosting/CDN).
- Data Safety evidence matrix: one row per data type → the exact table/column and code path that collects it, purpose, optional/required, retention. Refuse to submit a declaration not backed by a row here. Correct the existing `docs/play-store.md` table against the real schema (it currently lists crash logs and purchase history without verification).
- Deletion: in-app path (`/account/delete`, linked from `/more` and `/support`) plus the public web URL, both reachable signed out, both describing retention truthfully.
- Consent: confirm `ConsentNotice` choices actually gate whatever they claim to gate; if nothing non-essential exists, simplify to a notice rather than a false choice.
- Age/audience 18+, no ads declaration, and payments declared as real-world services (Play Billing exempt) — consistent with the fact that no in-app payment exists at V1.
- Acceptance: legal review sign-off; Data Safety matrix complete with code references.

## Phase 6 — Android/TWA build (P1)

Local Android tooling task, outputs committed as `android/`.

- Bubblewrap init from `https://app.trips.bd/manifest.webmanifest`; applicationId `bd.trips.app`; host `app.trips.bd`.
- `targetSdk`/`compileSdk` 36 (Android 16 — mandatory for new apps since Aug 31, 2026), `minSdk` 23 (Android 6) or 24; document the choice.
- Manifest: portrait lock matching the manifest `orientation`, App Links intent filters with `autoVerify`, splash/theme colours from brand tokens, edge-to-edge with `env(safe-area-inset-*)` already handled in the shell, status/navigation bar colours, network security config disallowing cleartext, R8 minification enabled for release.
- Back-navigation: hardware/gesture back must traverse app history and only exit at the root.
- Acceptance: debug APK installs and runs full-screen on a physical device; deep link `https://app.trips.bd/trips` opens the app, not Chrome.

## Phase 7 — Signing and Digital Asset Links (P0 gate)

- Generate the upload key, store it in the business password manager with documented custody and rotation; never in the repo.
- Enrol in Play App Signing; collect **both** SHA-256 fingerprints (upload key + Play-issued signing key).
- Replace both placeholders in `public/.well-known/assetlinks.json`, publish, and confirm `https://app.trips.bd/.well-known/assetlinks.json` returns 200 with `application/json`.
- Verify with Google's Statement List Tester and by installing the release build: **no URL bar** anywhere in the app.
- Acceptance: URL-bar test passes on a clean device after a Play internal-track install.

## Phase 8 — PWA/TWA quality (P1)

- Fix asset sizes: regenerate `icon-512.png` and `app-icon-512.png` at exactly 512×512, `feature-graphic.png` at exactly 1024×500. Validate maskable safe zone.
- Manifest validation via PWABuilder; screenshots already 1080×1920.
- Service worker decision: recommended minimal SW — precache the app shell and static assets, network-only for anything under the Supabase origin and all server-function calls, with an `/offline` fallback route and a skip-waiting update flow. Never cache authenticated responses. If a correct SW cannot be guaranteed, ship without one; a stale-auth bug is worse than no offline shell.
- External links (Tally forms, supplier sites) open in a Custom Tab, not inside the TWA scope.

## Phase 9 — Performance and reliability (P1)

- Mobile Core Web Vitals budget: LCP < 2.5s, INP < 200ms, CLS < 0.1 on a mid-range Android over 4G; cold TWA start < 3s to first meaningful paint.
- Bundle analysis and route-level code splitting; the heaviest routes today are `flights.tsx`, `transfers.tsx`, `trips.tsx`, `stays.tsx`.
- Image optimisation: responsive sizes, lazy loading, modern formats for hero/listing imagery.
- Supabase query efficiency: indexes for every filter/sort used by search; kill N+1 patterns in loaders.
- Error monitoring wired to the existing reporting hook, uptime checks on `/` and `/sitemap.xml`, timeouts and bounded retries on all server functions, graceful degradation when Supabase is unreachable.

## Phase 10 — Accessibility and mobile UX (P1)

48dp touch targets, 4.5:1 contrast across brand tokens, TalkBack pass on every core journey, visible focus, correct heading order (H1 work already landed), 200% system font scaling without clipping, small-screen (360dp) and large-screen sanity, portrait-locked with a documented rationale.

## Phase 11 — QA and testing matrix (P1)

- Unit: pricing/format helpers, state-machine guards, validators.
- Integration: server functions against a test Supabase project, including RLS negative tests.
- E2E (Playwright): all core journeys, signed-in and signed-out, plus throttled/offline runs.
- Device matrix: emulators Android 10/12/14/16 plus at least two physical devices common in Bangladesh (low-RAM included).
- Edge cases: duplicate submits, expired session mid-checkout, cancelled order, deletion flow, legal routes signed out, deep-link cold start, DAL verification.
- Play pre-launch report: zero crashes/ANRs, accessibility and security warnings triaged.

## Phase 12 — Store listing (P1)

Accurate name "Trips.bd — Hotels & Flights"; short/full descriptions rewritten to request-to-book reality; 512×512 icon; exact 1024×500 feature graphic; 4–8 phone screenshots that match the shipped UI; privacy, deletion and support URLs; every promo claim traceable to a shipped feature.

## Phase 13 — Play Console setup (business task)

App creation; **app access instructions with a working reviewer test account** (the app is login-gated for booking — omitting this is a common rejection); Data Safety from the Phase 5 matrix; content rating questionnaire; 18+ target audience; no-ads declaration; permissions rationale; Play App Signing; internal → closed → production progression with staged rollout (10% → 50% → 100%).

## Phase 14 — Release engineering (P1)

Replace the stale `webpack.yml` with a real CI workflow: typecheck, lint, unit + E2E, build, dependency scan, and a `assetlinks.json` placeholder guard that fails the build. Reproducible AAB build documented; `versionCode` monotonic from CI run number, `versionName` semver; changelog per release; rollback = halt rollout + previous-version resume; artifact retention 12 months; mapping file uploaded for deobfuscated crashes.

## Phase 15 — Launch gates (go/no-go)

Production release is blocked while **any** of these is unmet:

1. No placeholder contact info, address or phone anywhere in the app or listing.
2. `assetlinks.json` contains both real SHA-256 fingerprints and is live; release build shows no URL bar.
3. Account deletion actually deletes data end-to-end, in-app and via the public URL, within the disclosed SLA.
4. Data Safety declaration matches the evidence matrix line for line.
5. Privacy policy and Terms are truthful and reachable signed out.
6. `targetSdk` 36, release-signed AAB, mapping uploaded.
7. Google, Apple and email sign-in all verified inside the TWA on a physical device.
8. All shipped verticals complete request → confirmation → Trips → cancellation without error.
9. Zero P0 crashes/ANRs in the pre-launch report; error monitoring live.
10. No live/instant-booking claims anywhere; no demo inventory presented as real.
11. RLS negative tests green; security and dependency scans clean.
12. Reviewer test account documented in App access.

The app is not production-ready until all twelve pass.

## Phase 16 — Post-launch operations

Crash-free-session target ≥ 99.5% with alerting; support SLA one business day; deletion-request SLA 30 days with an internal 7-day target and an audit trail; documented incident response with rollback authority; privacy-safe product analytics (funnel and conversion only, no PII); daily review monitoring with response templates; a 30-day stabilisation plan reserving capacity for hotfixes before any new vertical ships.

## Milestones for execution in Lovable

- **M1 (Lovable):** Phase 0 truth pass + Phase 1 identity strings + Phase 5 legal rewrite + Phase 12 copy + Phase 8 asset resizing.
- **M2 (Lovable):** Phase 3 backend integrity — state machine, idempotency, rate limits, RLS tests, deletion fulfillment, demo-data flagging.
- **M3 (Lovable):** Phase 2 journey states, Phase 9 performance, Phase 10 a11y, Phase 11 test harness, Phase 14 CI.
- **M4 (local Android + Play Console):** Phase 6 build, Phase 7 signing/DAL, Phase 13 console setup, staged rollout.

## Division of labour

- **Lovable can do:** all web/app code, Supabase migrations and functions, legal page content, store copy drafting, image asset generation/resizing, CI workflow, tests, `assetlinks.json` updates once fingerprints are provided, docs.
- **Local Android tooling only:** Bubblewrap project, Gradle config, keystore generation, AAB build, emulator/device testing.
- **Play Console only:** app creation, Data Safety form, content rating, App access, signing enrolment, track management, rollout.
- **Business operations only:** real entity/contact details, support staffing, fulfilment operations per vertical, legal review, key custody.

## Open questions before M1

1. Which verticals are operationally fulfillable at launch (this sets the scope freeze)?
2. Confirmed legal entity name, address, phone and support mailboxes?
3. Is `bd.trips.app` final, and who holds the signing key?
4. Any payment gateway (bKash/SSLCOMMERZ) in V1 scope, or strictly request-to-book?
