import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, PageHeader } from "@/components/AppShell";
import { TallyForm } from "@/components/TallyForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support & Feedback — Trips.bd" },
      { name: "description", content: "Contact Trips.bd support about a booking, payment, refund or account issue, or send product feedback." },
      { property: "og:title", content: "Support & Feedback — Trips.bd" },
      { property: "og:description", content: "Get help with bookings, payments and your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SupportPage() {
  const { user } = useAuth();
  return (
    <AppShell>
      <PageHeader title="Support" subtitle="We reply within one business day" />
      <div className="px-2">
        <TallyForm form="support" title="Trips.bd support form" prefill={{ email: user?.email ?? undefined }} />
      </div>
      <section className="mx-5 mt-6 rounded-2xl border border-border p-4">
        <h2 className="text-[17px] font-semibold text-foreground">Contact details</h2>
        <ul className="mt-2 space-y-1 text-[15px] text-muted-foreground">
          <li>
            Support:{" "}
            <a href="mailto:support@trips.bd" className="font-medium text-brand underline underline-offset-2">
              support@trips.bd
            </a>
          </li>
          <li>
            Privacy requests:{" "}
            <a href="mailto:privacy@trips.bd" className="font-medium text-brand underline underline-offset-2">
              privacy@trips.bd
            </a>
          </li>
          <li>Phone: +880 1700 000000 (09:00–21:00 BST)</li>
          <li>Trips.bd, Gulshan Avenue, Dhaka 1212, Bangladesh</li>
        </ul>
        <div className="mt-3 flex gap-4 text-[15px]">
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
    </AppShell>
  );
}
