# Trips.bd — Android TWA build

This folder holds the reproducible Bubblewrap configuration. The generated Gradle project,
the keystore and the AAB are **not** committed. Run the steps below on a workstation with
JDK 17 and the Android SDK; they cannot run inside Lovable.

Release is gated by `docs/launch-gates.md`. Do not upload to Play while any gate is red.

## 1. Prerequisites

```bash
node -v            # >= 18
java -version      # 17
npm i -g @bubblewrap/cli
bubblewrap doctor  # installs/points at JDK + Android SDK
```

## 2. Generate the project from the committed config

```bash
cd android
bubblewrap init --manifest=https://app.trips.bd/manifest.webmanifest --directory=.
# When prompted, accept the values already in twa-manifest.json (packageId bd.trips.app,
# host app.trips.bd, start URL /?source=pwa). Bubblewrap rewrites twa-manifest.json —
# `git diff` it afterwards and revert any drift from the committed values.
```

`bubblewrap init` creates the signing key at `android/android.keystore`. Store it in the
company password manager immediately; losing it means losing the ability to update the app
(Play App Signing mitigates this only if enrolled at first upload — enrol).

## 3. Enforce API 36 and release hardening

Bubblewrap's template can lag Play requirements. After `init`, verify in `app/build.gradle`:

```gradle
compileSdkVersion 36
defaultConfig { minSdkVersion 23; targetSdkVersion 36 }
buildTypes { release { minifyEnabled true; shrinkResources true } }
```

Also confirm `AndroidManifest.xml` has:

- `android:screenOrientation="portrait"` on the launcher activity
- the `app.trips.bd` intent filter with `android:autoVerify="true"`
- `android:usesCleartextTraffic="false"` / a network security config forbidding cleartext

## 4. Build

```bash
bubblewrap build          # produces app-release-bundle.aab and app-release-signed.apk
```

Keep `app/build/outputs/mapping/release/mapping.txt` — it must be uploaded to Play with the
bundle so crash reports deobfuscate.

## 5. Digital Asset Links (blocks release)

```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

Paste that fingerprint **and** the Play App Signing fingerprint (Play Console → Setup →
App integrity) into `public/.well-known/assetlinks.json`, replacing both `REPLACE_WITH_*`
placeholders, then publish the web app. CI (`.github/workflows/release-gates.yml`) fails
while placeholders remain.

Verify before uploading:

```bash
curl -sI https://app.trips.bd/.well-known/assetlinks.json   # 200, application/json
bubblewrap validate --url=https://app.trips.bd/
```

Install the signed APK on a physical device: **no URL bar may appear**. A URL bar means the
asset links are wrong and Play quality review will flag it.

## 6. Versioning

`appVersionCode` is a monotonically increasing integer, one bump per upload, even for the
same `appVersionName`. Record each pair in `docs/play-store.md` release history.

## 7. Upload

Internal testing → closed testing → production, with the pre-launch report clean at each
step. Play Console tasks (Data Safety, content rating, app access reviewer account, store
listing) are described in `docs/play-store.md`.
