# Trips.bd — Google Play Store readiness (TWA/PWA)

Goal: make the web app packageable as a Trusted Web Activity (Bubblewrap/PWABuilder) and pass Google Play Console policy review. Today the app has no web manifest, no service worker, no `/privacy`, `/terms`, or account-deletion page (the Terms screen already links to `/terms` and `/privacy`, which 404), and no Digital Asset Links file.

## 1. Installability (TWA prerequisites)

- `public/manifest.webmanifest`: `name` "Trips.bd", `short_name` "Trips.bd", `start_url` "/?source=pwa", `scope` "/", `display: standalone`, `orientation: portrait`, `background_color`/`theme_color` from brand tokens, `lang: en`, `categories: ["travel","lifestyle"]`.
- Generated icons in `public/icons/`: 192, 512 (any) and 512 maskable, plus Apple touch icon.
- Play listing assets generated into `public/store/`: 512x512 app icon, 1024x500 feature graphic, and phone screenshots (home, stays results, flights results, trips) — also referenced in the manifest `screenshots` array so PWABuilder/Play can use them.
- Service worker (`public/sw.js`) with offline shell + registration in the root route; needed for install criteria and an offline fallback page (`/offline`).
- Manifest, theme-color, and apple meta tags added in `src/routes/__root.tsx` head.
- `public/.well-known/assetlinks.json` placeholder with the app package name `bd.trips.app` and a clearly marked SHA-256 fingerprint slot to fill after signing-key creation (TWA shows a URL bar until this is correct).

## 2. Play policy pages (mandatory)

- `/privacy` — full privacy policy route: data collected (account email, name, bookings, device/usage), Supabase as processor, third parties (Google/Apple sign-in, Tally forms), retention, user rights, contact. Must be reachable publicly without login (Play requires a public URL).
- `/terms` — terms of use / booking terms, cancellation and refund policy, governing law Bangladesh.
- `/account/delete` — account & data deletion request page. Play requires both an in-app path and a public web URL. Signed-in users can request deletion; signed-out users get instructions + a request form. Lists what is deleted vs retained (booking records for legal/financial reasons).
- `/support` already exists (Tally) — add explicit developer contact email and physical/business contact to satisfy the Play "Contact details" requirement.
- Link all of the above from `/more` under a "Legal & privacy" section, and fix the existing Terms screen links so they resolve.

## 3. In-app compliance components

- `CookieConsent` / data-use notice banner shown once, stored in localStorage (also feeds the Data Safety declaration).
- `InstallPrompt` component: captures `beforeinstallprompt`, shows a dismissible "Add to home screen" bar on browser (hidden in TWA via display-mode check).
- `useStandalone()` hook so the app can hide browser-only affordances when running inside the Play wrapper.
- Safe-area padding (`env(safe-area-inset-*)`) on the shell and bottom nav so the standalone app doesn't collide with system gesture bars.
- Android back-button behaviour: history-aware back handling in `AppShell` so the hardware back button doesn't close the TWA from nested screens.

## 4. Data Safety + submission notes

- `docs/play-store.md`: filled-in Data Safety answers (data types collected, encryption in transit, deletion URL), content rating questionnaire answers, target audience (18+), store listing copy (short + full description), and Bubblewrap CLI command with the exact manifest URL, package id, and signing steps.

## Technical notes

- All new routes are plain TanStack Start file routes with their own `head()` metadata (unique title/description) per the project's SEO rule; no server functions needed except an authenticated deletion-request function that writes to a `deletion_requests` table with RLS (insert own, service_role read).
- Service worker uses a network-first strategy for navigations, cache-first for hashed build assets; skips Supabase API calls entirely so realtime and auth are unaffected.
- No changes to existing vertical search/booking logic.

## Out of scope

- Actually building/signing the APK/AAB and uploading it (done in Bubblewrap + Play Console outside this project).
- Push notifications via FCM — can be a follow-up; the current in-app notifications feed stays as-is.
