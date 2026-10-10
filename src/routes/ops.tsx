import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { VerticalHeader } from "@/components/VerticalHeader";
import { useAuth } from "@/hooks/useAuth";
import { bdt } from "@/lib/format";
import {
  decideRequest,
  getStaffStatus,
  listConfirmedWithPayments,
  recordRefund,
  listPendingRequests,
} from "@/lib/ops.functions";

export const Route = createFileRoute("/ops")({
  component: OpsPage,
  head: () => ({
    meta: [
      { title: "Reservations desk — Trips.bd" },
      { name: "description", content: "Staff queue for confirming Trips.bd booking requests." },
      { property: "og:title", content: "Reservations desk — Trips.bd" },
      { property: "og:description", content: "Confirm or decline pending requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Item = {
  kind: "booking" | "order";
  id: string;
  reference: string;
  title: string;
  when: string;
  who: string;
  contact: string;
  total: number;
  note?: string | null;
};

function OpsPage() {
  const { user, loading } = useAuth();
  const staffFn = useServerFn(getStaffStatus);
  const listFn = useServerFn(listPendingRequests);
  const decideFn = useServerFn(decideRequest);
  const qc = useQueryClient();

  const staff = useQuery({ queryKey: ["staff"], queryFn: () => staffFn(), enabled: !!user });
  const queue = useQuery({
    queryKey: ["ops-queue"],
    queryFn: () => listFn(),
    enabled: staff.data?.staff === true,
    refetchInterval: 30_000,
  });

  const decide = useMutation({
    mutationFn: (v: { kind: Item["kind"]; id: string; decision: "confirmed" | "cancelled" }) =>
      decideFn({ data: v }),
    onSuccess: (r) => {
      toast.success(`${r.reference} ${r.status}`);
      void qc.invalidateQueries({ queryKey: ["ops-queue"] });
      void qc.invalidateQueries({ queryKey: ["ops-confirmed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  let body: React.ReactNode;
  if (loading || (user && staff.isLoading)) {
    body = <Loader2 className="mx-auto mt-10 animate-spin text-brand" />;
  } else if (!user) {
    body = (
      <Link to="/auth" className="block py-10 text-center font-semibold text-brand">
        Sign in
      </Link>
    );
  } else if (!staff.data?.staff) {
    body = <p className="py-10 text-center text-muted-foreground">Staff access only.</p>;
  } else {
    const items: Item[] = [
      ...(queue.data?.bookings ?? []).map((b) => ({
        kind: "booking" as const,
        id: b.id,
        reference: b.reference,
        title: `${b.listing?.title ?? "Stay"}${b.listing?.city ? `, ${b.listing.city}` : ""}`,
        when: `${b.check_in} → ${b.check_out}`,
        who: `${b.guest_name} · ${b.guests} guests`,
        contact: [b.guest_email, b.guest_phone].filter(Boolean).join(" · "),
        total: b.total_bdt,
        note: b.note,
      })),
      ...(queue.data?.orders ?? []).map((o) => ({
        kind: "order" as const,
        id: o.id,
        reference: o.reference,
        title: `${o.vertical}: ${o.title}`,
        when: new Date(o.starts_at).toLocaleString(),
        who: `${o.contact_name} · ${o.travellers} travellers`,
        contact: [o.contact_email, o.contact_phone].filter(Boolean).join(" · "),
        total: o.total_bdt,
      })),
    ];
    body = queue.isLoading ? (
      <Loader2 className="mx-auto mt-10 animate-spin text-brand" />
    ) : items.length === 0 ? (
      <p className="py-10 text-center text-muted-foreground">No pending requests.</p>
    ) : (
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-2xl border border-border p-4">
            <p className="text-[13px] font-semibold text-muted-foreground">{it.reference}</p>
            <p className="text-[17px] font-semibold text-foreground">{it.title}</p>
            <p className="text-[15px] text-muted-foreground">{it.when}</p>
            <p className="text-[15px] text-foreground">{it.who}</p>
            <p className="text-[13px] text-muted-foreground">{it.contact}</p>
            {it.note ? (
              <p className="mt-1 text-[14px] italic text-muted-foreground">{it.note}</p>
            ) : null}
            <p className="mt-2 text-[16px] font-semibold text-foreground">{bdt(it.total)}</p>
            <div className="mt-3 flex gap-2">
              <button
                disabled={decide.isPending}
                onClick={() => decide.mutate({ kind: it.kind, id: it.id, decision: "confirmed" })}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-brand py-2.5 font-semibold text-brand-foreground disabled:opacity-50"
              >
                <Check size={16} /> Confirm
              </button>
              <button
                disabled={decide.isPending}
                onClick={() => {
                  if (window.confirm(`Decline ${it.reference}?`))
                    decide.mutate({ kind: it.kind, id: it.id, decision: "cancelled" });
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-full border border-destructive py-2.5 font-semibold text-destructive disabled:opacity-50"
              >
                <X size={16} /> Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <AppShell>
      <VerticalHeader title="Reservations desk" summary="Pending requests" />
      <div className="px-5 pt-3">
        <Link
          to="/staff"
          className="text-[14px] font-semibold text-brand underline underline-offset-2"
        >
          Manage staff
        </Link>
      </div>
      <h1 className="sr-only">Reservations desk</h1>
      <div className="px-5 py-5">
        {body}
        {staff.data?.staff ? <ConfirmedPayments /> : null}
      </div>
    </AppShell>
  );
}

function ConfirmedPayments() {
  const listFn = useServerFn(listConfirmedWithPayments);
  const q = useQuery({
    queryKey: ["ops-confirmed"],
    queryFn: () => listFn(),
    refetchInterval: 30_000,
  });
  const rows = q.data ?? [];
  return (
    <section className="mt-8">
      <h2 className="text-[19px] font-semibold text-foreground">Confirmed · payments</h2>
      {q.isLoading ? (
        <Loader2 className="mx-auto mt-6 animate-spin text-brand" />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">No confirmed requests yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.reference}`}>
              <Link
                to={r.kind === "booking" ? "/booking/$reference" : "/order/$reference"}
                params={{ reference: r.reference }}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-muted-foreground">{r.reference}</p>
                  <p className="truncate text-[15px] font-semibold text-foreground">{r.title}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {r.who} · {bdt(r.total)}
                  </p>
                </div>
                {r.paid?.refunded ? (
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
                    Refunded
                  </span>
                ) : r.paid ? (
                  <span className="shrink-0 rounded-full bg-success px-2.5 py-1 text-[12px] font-semibold text-success-foreground">
                    Paid{r.paid.method?.startsWith("TEST") ? " (test)" : ""}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
                    Payment due
                  </span>
                )}
              </Link>
              {r.paid && !r.paid.refunded ? (
                <RefundButton kind={r.kind} reference={r.reference} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RefundButton({ kind, reference }: { kind: "booking" | "order"; reference: string }) {
  const fn = useServerFn(recordRefund);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (refundReference: string) => fn({ data: { kind, reference, refundReference } }),
    onSuccess: () => {
      toast.success(`Refund recorded for ${reference}`);
      void qc.invalidateQueries({ queryKey: ["ops-confirmed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <button
      type="button"
      disabled={m.isPending}
      onClick={() => {
        const ref = window.prompt(
          "Issue the refund in the EPS merchant panel first, then paste the EPS refund reference:",
        );
        if (ref?.trim()) m.mutate(ref.trim());
      }}
      className="mt-1 text-[13px] font-semibold text-destructive underline underline-offset-2"
    >
      {m.isPending ? "Recording refund…" : "Record refund"}
    </button>
  );
}
