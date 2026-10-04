import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { openIntercomChat } from "@/components/IntercomMessenger";
import { CompanyDetails } from "@/components/CompanyDetails";
import { SupportForm } from "@/components/SupportForm";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support & Feedback — Trips.bd" },
      {
        name: "description",
        content:
          "Contact Trips.bd support about a booking request, refund or account issue, or send product feedback.",
      },
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

      <section className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
          <MessageCircle size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-foreground">Live chat</h2>
          <p className="text-[15px] leading-snug text-muted-foreground">
            Chat with our team about a booking or your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!openIntercomChat()) {
              toast.error("Live chat is loading — try again in a moment, or use the form below.");
            }
          }}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-[15px] font-semibold text-brand-foreground"
        >
          Start chat
        </button>
      </section>

      <SupportForm />

      <section className="mx-5 mt-6 rounded-2xl border border-border p-4">
        <h2 className="text-[17px] font-semibold text-foreground">Contact details</h2>
        <ul className="mt-2 space-y-1 text-[15px] text-muted-foreground">
          <li>
            Support:{" "}
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="font-medium text-brand underline underline-offset-2"
            >
              {COMPANY.supportEmail}
            </a>
          </li>
          <li>
            Privacy requests:{" "}
            <a
              href={`mailto:${COMPANY.privacyEmail}`}
              className="font-medium text-brand underline underline-offset-2"
            >
              {COMPANY.privacyEmail}
            </a>
          </li>
          <li>
            Phone:{" "}
            <a
              href={COMPANY.phoneHref}
              className="font-medium text-brand underline underline-offset-2"
            >
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
          <Link
            to="/account/delete"
            className="font-medium text-brand underline underline-offset-2"
          >
            Delete account
          </Link>
        </div>
      </section>

      <CompanyDetails />
    </AppShell>
  );
}
