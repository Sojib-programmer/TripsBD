# Trips.bd — Forensic remediation (EPS, refunds, deletion, Play disclosures)

Scope: repository-only. No SQL execution, no migrations, no publish, no secret reads, no real payments/refunds, no Play Console changes.

## Verified facts driving the plan

- `payment_records.user_id` is `REFERENCES auth.users ON DELETE CASCADE`. On account deletion every payment row (EPS tx ID, method, refund ref) is **deleted**. Only `orders`/`bookings` amounts are archived into `retained_financial_records`. The privacy page currently says payment records are kept for 6 years, which is false.
- `pseudonym()` in `src/lib/deletion.server.ts` falls back to the hard-coded salt `"trips-bd-deletion"` (fail-open, predictable hashes).
- Deletion ignores errors on: the archive read, per-table deletes, profile delete, `deletion_audit` insert, `deletion_requests` update. `profiles` count is hard-coded to 1.
- `recordRefund` checks only the payment update error; booking/order cancel and notification inserts are unchecked; a retry after partial failure hits "No paid payment found" and cannot resume. Refunded rows disappear from `/ops` because the list only covers confirmed bookings.
- `docs/play-listing.md` says "No payment is taken in the app" and "a payment link"; this contradicts the EPS checkout.

## 1. Disclosures (docs + legal pages)

- `docs/product-truth.md`: rewrite the booking model: request-to-book, then EPS-hosted checkout for staff-confirmed bookings, server-verified status, manual refunds through the EPS merchant portal that staff then record. Correct the data table and the retention section to match the cascade.
- `docs/play-listing.md`: rewrite the "How booking works" and "Pricing and payment" text for EPS ("pay securely through EPS once we confirm"). Keep "No in-app purchases" only as "no digital-content purchases or subscriptions". Re-check character limits with a script.
- `docs/play-store.md` Data Safety: derive it again from the code. Collected: name, email, phone, user IDs, booking details/free text, purchase history (payment metadata), crash logs. Payment info (card/wallet credentials) is not collected because EPS hosts checkout. Add processors: Supabase, EPS, hosting, Sentry, Intercom. Deletion: user-deletable. Retained: pseudonymised booking/order amounts for 6 years. EPS tx IDs are not retained.
- `src/routes/privacy.tsx`: fix the payment-records retention ("deleted with your account; pseudonymised amounts kept 6 years"). Remove the stale sentence "We do not take payments in the app". Add Intercom as a processor. Bump the last-updated date.
- `src/routes/terms.tsx`: add payment/refund terms: EPS processes payment, refunds are issued manually through EPS, and timing depends on EPS and the provider.
- `docs/launch-gates.md`: re-grade every gate as VERIFIED / BLOCKED / NOT VERIFIED with evidence. Include all items in §7 of the brief: AAB, key custody, R8 mapping, fingerprints, DAL, device TWA, in-TWA sign-in (email only; Google/Apple removed), deletion, cross-user RLS, Sentry, reviewer account, Data Safety, pre-launch report, dependency findings.

## 2. Refund workflow (`src/lib/ops.functions.ts`, `src/routes/ops.tsx`)

- Extract pure step logic into `src/lib/refund.ts` with an injected DB adapter so it can be tested.
- Flow: assertStaff, then validate the reference and refund reference (charset regex), then load the payment for the reference (paid or refunded).
  - paid: conditional update to refunded (`.eq status paid`, check the error and the affected row).
  - already refunded: keep the stored refund details. If the supplied reference differs, reject it.
  - Then resume idempotently: cancel the booking/order only if it is not already cancelled, and insert an event plus a notification only if no "Payment refunded" notification exists for that reference. Check every error.
- Return `{ steps: {...}, complete: boolean }`. The UI shows "Partially recorded, press Retry" instead of a success toast. Require a confirmation checkbox: "Refund already issued in the EPS merchant portal".
- Add `listRecentRefunds` (staff-only, last 30 days) and a "Recent refunds" section in `/ops` with a Refunded badge.

## 3. Account deletion (`src/lib/deletion.server.ts`)

- `pseudonym()` throws `DeletionConfigError` when `DELETION_PSEUDONYM_SALT` is missing or shorter than 32 characters. The secret is never logged. The compliance function maps the error to a generic "Deletion temporarily unavailable" message and the request stays `pending`.
- Check every step's error. Record real counts. Write the audit row before marking the request completed. If any step fails, throw; never return ok.
- Order of steps: validate config, archive, delete personal rows, delete auth user (cascades payment_records), write audit, mark the request complete.
- User action needed: add the `DELETION_PSEUDONYM_SALT` secret. Until it is set, deletion fails closed. This is a deliberate behaviour change and will be reported.

## 4. Security re-audit (read-only plus small fixes)

- Go through each privileged server function and confirm that it calls assertStaff/assertAdmin or checks ownership; that admin is imported only inside handlers; and that `setStaffRole` cannot self-escalate.
- EPS return: add a check that `v.merchantTransactionId` (when present) equals `tx`, and treat a missing verified amount as not paid. The current `v.amount === null` is accepted as ok, which is fail-open, so this gets fixed.
- `simulateTestPayment`: confirm it is disabled whenever any EPS env var is set and that it is labelled TEST.
- Remove PII from the `console.error` calls in the EPS and refund paths.

## 5. Tests (vitest, mocks only)

- `tests/deletion/pseudonym.test.ts`: missing salt throws, short salt throws, output is deterministic and salt-dependent.
- `tests/deletion/fulfil.test.ts`: a failure at each step yields no ok and no completed status.
- `tests/refund/refund.test.ts`: validation, a duplicate with a different reference is rejected, resume after cancel failure, no duplicate notification.
- `tests/eps/return-verify.test.ts`: a null amount or a tx mismatch means not paid.
- `tests/disclosure/contradictions.test.ts`: fails if docs or privacy contain "No payment is taken", "never hold payment", or the forbidden booking phrases.

## 6. Verification and report

- Run `tsgo`, `bun run lint` (format only the touched files plus the two known ai-elements files), `vitest`, the build, the release-gates script checks, and `bun audit`/`npm audit --package-lock-only` where available. Also run static greps for placeholder fingerprints and secrets.
- Make read-only `curl -I` calls against the six production URLs and diff the HTML/manifest/assetlinks against the working tree.
- Final report sections 1–10 as specified, with real command outputs. State explicitly that nothing was deployed and no database was touched.

## Blocked / user-side (reported, not done)

- `DELETION_PSEUDONYM_SALT` secret value; live EPS payment and refund test; staff sign-in (first-admin SQL); AAB, keystore and fingerprints; device TWA QA; Sentry DSN; RLS test accounts; Play Console declarations; leaked-password protection (Supabase Pro).
