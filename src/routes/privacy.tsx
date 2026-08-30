import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Trips.bd" },
      {
        name: "description",
        content:
          "How Trips.bd collects, uses, shares and deletes your personal data when you book hotels, flights, trains, transfers, cars, activities and eSIM.",
      },
      { property: "og:title", content: "Privacy Policy — Trips.bd" },
      { property: "og:description", content: "Our data collection, use, sharing and deletion practices." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const UPDATED = "29 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[19px] font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="Privacy Policy" subtitle={`Last updated ${UPDATED}`} />
      <div className="px-5 pb-10">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Trips.bd ("we", "us") operates the Trips.bd website and Android application, a travel
          marketplace for stays, flights, trains, airport transfers, car rentals, activities and eSIM
          in and around Bangladesh. This policy explains what we collect, why, and the control you
          have over it.
        </p>

        <Section title="Data we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Account data</strong> — email address, name, and
              (optionally) phone number and avatar, created when you register or sign in with Google
              or Apple.
            </li>
            <li>
              <strong className="text-foreground">Booking data</strong> — searches, selected
              inventory, travel dates, traveller counts, booking references, order status and totals.
            </li>
            <li>
              <strong className="text-foreground">Support data</strong> — messages and form
              submissions you send us.
            </li>
            <li>
              <strong className="text-foreground">Device and usage data</strong> — app version,
              device type, coarse language/region, crash and performance diagnostics.
            </li>
          </ul>
          <p>
            We do not collect precise location, contacts, photos, SMS, call logs, or financial
            instrument numbers in the app.
          </p>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc space-y-1 pl-5">
            <li>To create and secure your account and keep you signed in.</li>
            <li>To process booking requests and show your trips and order status.</li>
            <li>To send transactional notifications about your bookings.</li>
            <li>To provide customer support and resolve disputes.</li>
            <li>To detect fraud, abuse and to meet legal and accounting obligations.</li>
          </ul>
        </Section>

        <Section title="Sharing">
          <p>
            We share only what is needed to deliver a booking: the traveller name, contact and trip
            details go to the supplier fulfilling it (hotel, airline, operator, transfer or rental
            partner). We also use these processors:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Supabase — database, authentication and realtime hosting.</li>
            <li>Google and Apple — sign-in, only when you choose those buttons.</li>
            <li>Tally — hosted forms for support requests and property listings.</li>
          </ul>
          <p>We never sell personal data or share it with data brokers.</p>
        </Section>

        <Section title="Security">
          <p>
            All traffic is encrypted in transit with TLS. Data is stored in access-controlled
            Postgres with row-level security so a signed-in user can only reach their own records.
          </p>
        </Section>

        <Section title="Retention">
          <p>
            Account data is kept while your account is active. Booking and payment records are kept
            for up to 6 years where tax and consumer-protection law requires it, then deleted or
            irreversibly anonymised. Support messages are kept for 24 months.
          </p>
        </Section>

        <Section title="Your rights and data deletion">
          <p>
            You can access, correct, export or delete your data at any time. Use the in-app{" "}
            <Link to="/account/delete" className="font-semibold text-brand underline underline-offset-2">
              Delete my account
            </Link>{" "}
            page, or email{" "}
            <a href="mailto:privacy@trips.bd" className="font-semibold text-brand underline underline-offset-2">
              privacy@trips.bd
            </a>
            . We action verified requests within 30 days.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Trips.bd is intended for users aged 18 and over. We do not knowingly collect data from
            children. Contact us if you believe a child has created an account.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            We will post material changes on this page and update the date above. Questions:{" "}
            <a href="mailto:privacy@trips.bd" className="font-semibold text-brand underline underline-offset-2">
              privacy@trips.bd
            </a>{" "}
            · Trips.bd, Gulshan, Dhaka 1212, Bangladesh.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
