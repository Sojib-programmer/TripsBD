# Trips.bd → Google Play Internal Testing

Locked: V1 = stays, flights, activities, airport transfers. Cars/eSIM/trains/packages stay ComingSoon. Request-to-book, no live inventory, no in-app payment. `bd.trips.app` on `app.trips.bd`, compile/target SDK 36, min 23.

Ownership: **[A] Lovable** · **[B] your Android workstation** · **[C] Play Console**.

---

## Phase 1 — Final Lovable preflight [A]

Run in one batch and report actual output, not claims:

1. `bun run typecheck && bun run lint && bun run test && bun run build` — all must exit 0. Lint currently exits 0 with 8 warnings; either silence or accept them explicitly.
2. Public-route audit signed out, local and on `https://app.trips.bd`: every route 200, `manifest.webmanifest`, `/.well-known/assetlinks.json`, `/icons/*`, `/robots.txt`, `/sitemap.xml` served with the right status; repo content must match the published build.
3. Scope guard: `rg` for out-of-scope verticals, instant-confirmation and payment claims; confirm cars/eSIM/trains/packages still render ComingSoon and no catalogue rows render while `INVENTORY_LIVE` is unset.
4. Auth + deletion: confirm `signInWith*` `redirectTo` resolves to the production origin inside a TWA, `/account/delete` reachable signed out, deletion removes support messages while retaining `deletion_audit` / `retained_financial_records`; re-run `tests/rls/anonymous-access.test.ts`.
5. Monitoring: if you give me `VITE_SENTRY_DSN` I add it as a secret, confirm the release tag `trips-bd@1.0.0` matches `android/twa-manifest.json` and that scrubbing holds; without it monitoring stays inert and this step is skipped, not faked.
6. Publish the web build.

Blocking inputs from you: Sentry DSN (optional), two throwaway accounts for the cross-user RLS suite (optional — suite stays skipped otherwise), and confirmation in the Supabase dashboard that Google/Apple providers are enabled with `https://app.trips.bd/**` in the redirect allowlist. I cannot toggle that external project.

Done when: build green, published output matches repo, redirect allowlist confirmed.

## Phase 2 — Signed AAB on your machine [B]

Follow `android/README.md` verbatim. Summary:

```text
JDK 17 + Android SDK + Node 18+ + npm i -g @bubblewrap/cli
cd android && bubblewrap init --manifest=https://app.trips.bd/manifest.webmanifest --directory=.
git diff twa-manifest.json   # revert any drift from committed values
```

Verify in the generated Gradle project before building: `compileSdkVersion 36`, `minSdkVersion 23`, `targetSdkVersion 36`, release `minifyEnabled true` + `shrinkResources true`, launcher activity `portrait`, `app.trips.bd` intent filter with `autoVerify="true"`, cleartext traffic disabled.

Keystore: `bubblewrap init` writes `android/android.keystore`. **Back it up to the company password manager and confirm the backup before any upload** — losing it ends your ability to ship updates.

```text
bubblewrap build   # app-release-bundle.aab + app-release-signed.apk
keep app/build/outputs/mapping/release/mapping.txt
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

Install the APK on a physical phone and run: Google/Apple/email sign-in, one request in each of the four V1 verticals, Trips status, cancellation, support message, account deletion, back gesture, offline state. Expect a URL bar at this stage — assetlinks fingerprints are not in yet.

## Phase 3 — Internal Testing upload + fingerprint handoff [C] → [A]

Create the app with package `bd.trips.app`, enroll in Play App Signing, upload the AAB and `mapping.txt` to Internal Testing.

Send me exactly two strings:

- upload key SHA-256 (from `keytool` above)
- Play App Signing SHA-256 (Play Console → Setup → App integrity)

I replace `REPLACE_WITH_UPLOAD_KEY_SHA256_FINGERPRINT` and `REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FINGERPRINT` in `public/.well-known/assetlinks.json` and publish. I will not invent fingerprints; `release-gates.yml` stays red until both are real.

Then reinstall from the Internal Testing track: **no URL bar** is the pass condition.

## Phase 4 — Play Console completion [C]

Store listing from `docs/play-listing.md` · Data Safety from `docs/play-store.md` §2 · content rating questionnaire · App access reviewer account and script · privacy and deletion URLs (`/privacy`, `/account/delete`) · Internal testing live · pre-launch report clean · closed testing if your account type requires 14 days · production staged rollout.

---

## Technical notes

- Only file I change in Phase 3 is `public/.well-known/assetlinks.json`.
- `app.trips.bd/manifest.webmanifest` is served as `application/octet-stream`; Bubblewrap tolerates it, non-blocking.
- Cross-user RLS tests stay skipped without `RLS_TEST_USER_A_EMAIL/PASSWORD` and `RLS_TEST_USER_B_EMAIL/PASSWORD`.

## Immediate next action

Approve this and I run Phase 1 now. Phase 2 starts on your machine in parallel — do not upload until the keystore backup is confirmed.
