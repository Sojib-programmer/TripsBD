import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { COMPANY, COMPANY_ADDRESS } from "@/lib/company";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Use — Trips.bd" },
      {
        name: "description",
        content:
          "The terms that apply when you use Trips.bd: how request-to-book works, pricing, cancellations, your responsibilities and our liability.",
      },
      { property: "og:title", content: "Terms of Use — Trips.bd" },
      { property: "og:description", content: "How booking requests, pricing and cancellations work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const LAST_UPDATED = "5 September 2026";

function TermsPage() {
  return (
    <AppShell>
      <PageHeader title="Terms of Use" subtitle={`Last updated ${LAST_UPDATED}`} />
      <div className="space-y-6 px-5 pb-12 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          These terms are an agreement between you and {COMPANY.legalName}, trading as{" "}
          {COMPANY.tradingName} ({COMPANY.website}). By using the app you accept them. You must be
          18 or older to send a booking request.
        </p>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">1. What Trips.bd is</h2>
          <p className="mt-2">
            Trips.bd is a request-to-book travel agency service. You tell us what you need; our
            team checks availability and price with the hotel, airline agent or transport
            operator, then replies to you. We act as your agent in arranging the booking; the
            supplier performs the travel service itself.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">2. Nothing is booked until we confirm</h2>
          <p className="mt-2">
            Sending a request creates no reservation and no contract with a supplier. Anything
            shown in the app before we confirm is indicative only. A booking exists only once we
            confirm it to you in writing with a reference and a final price.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">3. Prices and payment</h2>
          <p className="mt-2">
            All prices are in Bangladeshi Taka. No payment is taken inside the app and there are
            no in-app purchases. After we confirm availability we send a payment instruction
            separately. Taxes, resort fees or supplier surcharges are stated before you pay.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">4. Changes and cancellations</h2>
          <p className="mt-2">
            You can cancel any request in the app while it is pending or confirmed, from the
            request page or from{" "}
            <Link to="/trips" className="font-medium text-brand underline underline-offset-2">
              My Trips
            </Link>
            . Cancelling before we confirm availability is always free. After confirmation, the
            supplier&apos;s own cancellation and refund rules apply and are quoted to you at the
            time of confirmation. Refunds are returned by the same method you paid, within 14
            business days of the supplier releasing the funds.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">5. Your responsibilities</h2>
          <p className="mt-2">
            Give accurate traveller names and contact details, hold valid travel documents and
            visas, and arrive at the times confirmed. You are responsible for activity on your
            account. Do not misuse the service, submit false requests, or attempt to access other
            travellers&apos; data.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">6. Liability</h2>
          <p className="mt-2">
            We are responsible for arranging your booking with reasonable care and skill. We are
            not liable for a supplier&apos;s own acts or omissions, or for delays, weather,
            strikes and other events outside our control. Nothing in these terms limits liability
            that cannot be limited under the law of Bangladesh.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">7. Account termination</h2>
          <p className="mt-2">
            You may delete your account at any time at{" "}
            <Link to="/account/delete" className="font-medium text-brand underline underline-offset-2">
              app.trips.bd/account/delete
            </Link>
            . We may suspend an account that abuses the service or breaches these terms.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] font-semibold text-foreground">8. Governing law and contact</h2>
          <p className="mt-2">
            These terms are governed by the laws of Bangladesh, with the courts of Bangladesh
            having jurisdiction.
          </p>
          <p className="mt-2">
            {COMPANY.legalName} · {COMPANY_ADDRESS}
            <br />
            Trade licence {COMPANY.tradeLicence} · TIN {COMPANY.tin}
            <br />
            <a href={`mailto:${COMPANY.supportEmail}`} className="font-medium text-brand underline underline-offset-2">
              {COMPANY.supportEmail}
            </a>{" "}
            ·{" "}
            <a href={COMPANY.phoneHref} className="font-medium text-brand underline underline-offset-2">
              {COMPANY.phone}
            </a>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
