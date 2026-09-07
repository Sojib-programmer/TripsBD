import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { CompanyDetails } from "@/components/CompanyDetails";
import { SupportForm } from "@/components/SupportForm";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support & Feedback — Trips.bd" },
      { name: "description", content: "Contact Trips.bd support about a booking request, refund or account issue, or send product feedback." },
      { property: "og:title", content: "Support & Feedback — Trips.bd" },
      { property: "og:description", content: "Get help with booking requests and your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SupportPage() {
  return (
    <AppShell>
      <PageHeader title="Support" subtitle="We reply within one business day" />
      <SupportForm />

      <section className="mx-5 mt-6 rounded-2xl border border-border p-4">
        <h2 className="text-[17px] font-semibold text-foreground">Contact details</h2>
        <ul className="mt-2 space-y-1 text-[15px] text-muted-foreground">
          <li>
            Support:{" "}
            <a href={`mailto:${COMPANY.supportEmail}`} className="font-medium text-brand underline underline-offset-2">
              {COMPANY.supportEmail}
            </a>
          </li>
          <li>
            Privacy requests:{" "}
            <a href={`mailto:${COMPANY.privacyEmail}`} className="font-medium text-brand underline underline-offset-2">
              {COMPANY.privacyEmail}
            </a>
          </li>
          <li>
            Phone:{" "}
            <a href={COMPANY.phoneHref} className="font-medium text-brand underline underline-offset-2">
              {COMPANY.phone}
            </a>
          </li>
          <li>Response time: {COMPANY.supportHours}</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-4 text-[15px]">
          <Link to="/privacy" className="font-medium text-brand underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link to="/terms" className="font-medium text-brand underline underline-offset-2">
            Terms of Use
          </Link>
          <Link to="/account/delete" className="font-medium text-brand underline underline-offset-2">
            Delete account
          </Link>
        </div>
      </section>

      <CompanyDetails />
    </AppShell>
  );
}
