import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, CreditCard, Globe, LifeBuoy, Shield, User } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/more")({
  component: MorePage,
  head: () => ({
    meta: [
      { title: "Account & Settings — Trips.bd" },
      { name: "description", content: "Manage your Trips.bd account, payment methods, currency and support preferences." },
      { property: "og:title", content: "Account & Settings — Trips.bd" },
      { property: "og:description", content: "Account, payments, currency and support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const rows = [
  { icon: User, label: "Personal details" },
  { icon: CreditCard, label: "Payment methods" },
  { icon: Globe, label: "Currency & language" },
  { icon: Shield, label: "Privacy & security" },
  { icon: LifeBuoy, label: "Help centre" },
];

function MorePage() {
  return (
    <AppShell>
      <PageHeader title="More" subtitle="Account and app settings" />

      <section className="mx-5 rounded-2xl border border-border p-4">
        <Logo size="sm" />
        <p className="mt-3 text-[15px] text-muted-foreground">
          Sign in to sync bookings across devices and unlock VIP member prices.
        </p>
        <Link
          to="/welcome"
          className="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground"
        >
          Login / Sign up
        </Link>
      </section>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {rows.map(({ icon: Icon, label }) => (
          <li key={label}>
            <button className="flex w-full items-center gap-3 px-5 py-4 text-left">
              <Icon size={22} className="text-brand" />
              <span className="flex-1 text-[17px] text-foreground">{label}</span>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
