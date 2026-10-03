import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Clock } from "lucide-react";

import { getPaymentState } from "@/lib/eps.functions";
import { bdt } from "@/lib/format";

/**
 * Printable voucher for a staff-confirmed booking/order.
 * Payment details come only from server-verified EPS records (payment_records, status = paid).
 */
export function ConfirmedVoucher({
  kind,
  reference,
  title,
  lines,
  total,
}: {
  kind: "booking" | "order";
  reference: string;
  title: string;
  lines: string[];
  total: number;
}) {
  const stateFn = useServerFn(getPaymentState);
  const state = useQuery({
    queryKey: ["payment", kind, reference],
    queryFn: () => stateFn({ data: { kind, reference } }),
  });
  const paid = state.data?.paid ?? null;

  return (
    <section className="mt-5 rounded-2xl border-2 border-dashed border-brand p-4 print:border-solid">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">
          Confirmed voucher
        </p>
        {paid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[12px] font-semibold text-success-foreground">
            <BadgeCheck size={14} /> Confirmed &amp; paid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[12px] font-semibold text-muted-foreground">
            <Clock size={14} /> Payment due
          </span>
        )}
      </div>
      <p className="mt-1 text-[20px] font-semibold text-foreground">{reference}</p>
      <p className="text-[15px] text-foreground">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-[15px] text-muted-foreground">
          {l}
        </p>
      ))}

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-muted p-3 text-[14px]">
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="text-right font-semibold text-foreground">
          {bdt(paid ? paid.amount_bdt : total)}
        </dd>
        {paid ? (
          <>
            <dt className="text-muted-foreground">Payment ref</dt>
            <dd className="break-all text-right font-mono text-foreground">
              {paid.eps_transaction_id ?? "—"}
            </dd>
            <dt className="text-muted-foreground">Method</dt>
            <dd className="text-right text-foreground">
              EPS{paid.payment_method ? ` · ${paid.payment_method}` : ""}
            </dd>
            <dt className="text-muted-foreground">Paid on</dt>
            <dd className="text-right text-foreground">
              {new Date(paid.updated_at).toLocaleString()}
            </dd>
          </>
        ) : (
          <>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-right text-foreground">Not paid yet</dd>
          </>
        )}
      </dl>

      <p className="mt-2 text-[14px] text-muted-foreground">
        {paid
          ? "Show this voucher and payment reference at check-in."
          : "Your booking is confirmed. Pay below, or as agreed with our team, to complete it."}
      </p>
      <button
        onClick={() => window.print()}
        className="mt-3 rounded-full border border-border px-4 py-2 text-[14px] font-semibold text-foreground print:hidden"
      >
        Save / print voucher
      </button>
    </section>
  );
}
