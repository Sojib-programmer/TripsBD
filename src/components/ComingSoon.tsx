import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { VerticalHeader } from "@/components/VerticalHeader";

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <AppShell>
      <VerticalHeader title={title} summary="Not available yet" />
      <div className="mx-5 mt-6 rounded-2xl border border-border p-5">
        <Clock size={26} className="text-brand" />
        <h2 className="mt-3 text-[19px] font-semibold text-foreground">Coming soon</h2>
        <p className="mt-2 text-[15px] leading-snug text-muted-foreground">{blurb}</p>
        <p className="mt-3 text-[15px] leading-snug text-muted-foreground">
          We only list services our team can actually fulfil today, so this one is switched off
          until suppliers are contracted.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-full bg-brand px-5 py-2.5 text-[15px] font-semibold text-brand-foreground"
          >
            Back to home
          </Link>
          <Link
            to="/support"
            className="rounded-full border border-border px-5 py-2.5 text-[15px] font-semibold text-foreground"
          >
            Ask our team
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
