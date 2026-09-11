import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { COMPANY, COMPANY_ADDRESS } from "@/lib/company";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Trips.bd" },
      {
        name: "description",
        content:
          "What data Trips.bd collects, why we collect it, who we share it with, how long we keep it, and how to delete your account.",
      },
      { property: "og:title", content: "Privacy Policy — Trips.bd" },
      { property: "og:description", content: "Data we collect, why, and how to delete it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const LAST_UPDATED = "10 September 2026";

const DATA = [
  {
    what: "Account data — email address, and name and photo if you sign in with Google or Apple",
    why: "To create and secure your account and let you sign back in",
    keep: "Until you delete your account",
  },
  {
    what: "Booking request data — traveller name, email, phone, dates, group size and your notes",
    why: "To source and fulfil the booking request you send us",
    keep: "Until you delete your account; anonymised amounts kept for 6 years for accounting",
  },
  {
    what: "Support messages you send us in the app",
    why: "To answer your question",
    keep: "Until you delete your account",
  },
  {
    what: "Saved listings and in-app notifications",
    why: "To show your shortlist and the status of your requests",
    keep: "Until you delete your account",
  },
  {
    what: "Crash and error diagnostics — error message, screen, device and app version",
    why: "To find and fix crashes so the app stays stable",
    keep: "90 days. Email addresses, phone numbers and access tokens are stripped before the report leaves your device",
  },
];

function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="Privacy Policy" subtitle={`Last updated ${LAST_UPDATED}`} />
      <div className="space-y-6 px-5 pb-12 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          This policy explains how {COMPANY.legalName}, trading as {COMPANY.tradingName}, handles
          your personal data in the Trips.bd app and at {COMPANY.website}. We are the data
          controller.
        </p>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">What we collect and why</h2>
          <ul className="mt-3 space-y-4">
            {DATA.map((row) => (
              <li key={row.what} className="rounded-2xl border border-border p-4">
                <p className="font-medium text-foreground">{row.what}</p>
                <p className="mt-1">Why: {row.why}</p>
                <p className="mt-1">Retention: {row.keep}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            We do not collect precise location, contacts, photos, health data or advertising
            identifiers. We do not take payments in the app, so we never hold your card details. We
            do not sell personal data, and we do not use it for advertising or profiling.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">Who we share it with</h2>
          <p className="mt-2">
            Supabase, our database and authentication provider, stores the data on our behalf.
            Google and Apple process your sign-in if you choose those options. When you send a
            booking request, we pass only the details needed for that booking (traveller name,
            dates, group size, contact number) to the hotel, airline agent or transport operator
            fulfilling it. Nothing else is shared.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">Your rights</h2>
          <p className="mt-2">
            You can access, correct, export or delete your data. Deletion is immediate and
            self-service at{" "}
            <Link
              to="/account/delete"
              className="font-medium text-brand underline underline-offset-2"
            >
              app.trips.bd/account/delete
            </Link>
            : it removes your account, profile, requests, saved items, notifications and support
            messages. Anonymised transaction amounts (no name, email or phone) are kept for six
            years to meet Bangladesh accounting and tax obligations.
          </p>
          <p className="mt-2">
            To exercise any other right, email{" "}
            <a
              href={`mailto:${COMPANY.privacyEmail}`}
              className="font-medium text-brand underline underline-offset-2"
            >
              {COMPANY.privacyEmail}
            </a>
            . We respond within one business day and complete requests within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">Children</h2>
          <p className="mt-2">
            Trips.bd is for people aged 18 and over. We do not knowingly collect data from children.
            If you believe a child has an account, email {COMPANY.privacyEmail} and we will delete
            it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">Security</h2>
          <p className="mt-2">
            Data is encrypted in transit, held in access-controlled databases with row-level
            security so one traveller can never read another traveller&apos;s records, and
            accessible to a small number of staff who need it to fulfil bookings.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            {COMPANY.legalName} · {COMPANY_ADDRESS}
            <br />
            Phone:{" "}
            <a
              href={COMPANY.phoneHref}
              className="font-medium text-brand underline underline-offset-2"
            >
              {COMPANY.phone}
            </a>
            <br />
            Privacy:{" "}
            <a
              href={`mailto:${COMPANY.privacyEmail}`}
              className="font-medium text-brand underline underline-offset-2"
            >
              {COMPANY.privacyEmail}
            </a>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
