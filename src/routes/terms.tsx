import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Use — Trips.bd" },
      {
        name: "description",
        content:
          "The booking, cancellation, refund, payment and acceptable-use terms that apply when you use Trips.bd.",
      },
      { property: "og:title", content: "Terms of Use — Trips.bd" },
      { property: "og:description", content: "Booking, cancellation, refund and acceptable-use terms." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[19px] font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <AppShell>
      <PageHeader title="Terms of Use" subtitle="Last updated 29 August 2026" />
      <div className="px-5 pb-10">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          By creating an account or placing a booking request on Trips.bd you agree to these terms.
          If you do not agree, do not use the service.
        </p>

        <Section title="1. What Trips.bd is">
          <p>
            Trips.bd is an intermediary. We display inventory from hotels, homes, airlines, rail and
            transport operators and activity providers and pass your request to them. The travel
            contract for the service itself is between you and that supplier.
          </p>
        </Section>

        <Section title="2. Eligibility and accounts">
          <p>
            You must be 18 or older and able to enter a binding contract. Keep your credentials
            secure; you are responsible for activity on your account.
          </p>
        </Section>

        <Section title="3. Bookings and pricing">
          <p>
            Prices are shown in Bangladeshi Taka (BDT) and include stated taxes and fees unless
            marked otherwise. A booking request is confirmed only when you receive a confirmed status
            and reference in the app. If a supplier cannot honour a request, we cancel it and refund
            in full.
          </p>
        </Section>

        <Section title="4. Cancellations and refunds">
          <p>
            Each listing shows its cancellation policy; that policy governs. Where a booking is
            refundable, approved refunds are returned to the original payment method within 7–14
            business days. Non-refundable and promotional fares cannot be cancelled for a refund but
            may be eligible for supplier-side date changes at their discretion.
          </p>
        </Section>

        <Section title="5. Your responsibilities">
          <p>
            Provide accurate traveller details, valid identification and any visa or health documents
            required for your trip. We are not liable for denied boarding or check-in caused by
            incorrect or missing documents.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>
            Do not scrape, resell, reverse-engineer or disrupt the service, submit fraudulent
            bookings or payments, or post reviews for trips you did not take.
          </p>
        </Section>

        <Section title="7. Liability">
          <p>
            To the extent permitted by law, our liability for any booking is limited to the amount
            you paid through Trips.bd for that booking. We are not liable for supplier acts,
            omissions, delays or force-majeure events.
          </p>
        </Section>

        <Section title="8. Governing law">
          <p>
            These terms are governed by the laws of Bangladesh, with the courts of Dhaka having
            exclusive jurisdiction.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Questions or complaints:{" "}
            <Link to="/support" className="font-semibold text-brand underline underline-offset-2">
              our support page
            </Link>{" "}
            or{" "}
            <a href="mailto:support@trips.bd" className="font-semibold text-brand underline underline-offset-2">
              support@trips.bd
            </a>
            . See also our{" "}
            <Link to="/privacy" className="font-semibold text-brand underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
