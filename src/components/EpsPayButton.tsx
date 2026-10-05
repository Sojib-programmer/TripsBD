import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getPaymentState, simulateTestPayment, startEpsPayment } from "@/lib/eps.functions";
import { bdt } from "@/lib/format";

/** Pay-with-EPS block. Shown only for confirmed requests; hidden if EPS isn't configured. */
export function EpsPayButton({
  kind,
  reference,
  status,
  total,
}: {
  kind: "booking" | "order";
  reference: string;
  status: string;
  total: number;
}) {
  const stateFn = useServerFn(getPaymentState);
  const startFn = useServerFn(startEpsPayment);
  const state = useQuery({
    queryKey: ["payment", kind, reference],
    queryFn: () => stateFn({ data: { kind, reference } }),
  });
  const start = useMutation({
    mutationFn: () => startFn({ data: { kind, reference } }),
    onSuccess: ({ redirectUrl }) => {
      window.location.href = redirectUrl;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!state.data) return null;
  const { enabled, paid, last } = state.data;

  if (paid) {
    return (
      <section className="mt-4 flex items-center gap-3 rounded-2xl border border-brand p-4">
        <BadgeCheck className="shrink-0 text-brand" />
        <div>
          <p className="text-[16px] font-semibold text-foreground">Paid {bdt(paid.amount_bdt)}</p>
          <p className="text-[13px] text-muted-foreground">
            via EPS{paid.payment_method ? ` · ${paid.payment_method}` : ""}
            {paid.eps_transaction_id ? ` · ${paid.eps_transaction_id}` : ""}
          </p>
        </div>
      </section>
    );
  }

  if (status !== "confirmed" || total <= 0) return null;
  if (!enabled) {
    return state.data.testMode ? (
      <TestPaymentPanel kind={kind} reference={reference} total={total} />
    ) : null;
  }

  return (
    <section className="mt-4 rounded-2xl border border-border p-4">
      <p className="text-[16px] font-semibold text-foreground">Pay securely</p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        bKash, Nagad, Rocket, Upay, cards and internet banking via EPS.
      </p>
      {last && (last.status === "failed" || last.status === "cancelled") ? (
        <p className="mt-2 text-[13px] text-destructive">
          Your last payment attempt didn't go through. You can try again.
        </p>
      ) : null}
      <button
        onClick={() => start.mutate()}
        disabled={start.isPending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-[16px] font-semibold text-brand-foreground disabled:opacity-60"
      >
        {start.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
        Pay {bdt(total)} with EPS
      </button>
    </section>
  );
}

const METHODS = ["bKash", "Nagad", "Rocket", "Card"] as const;

/** Staff-only sandbox: simulates the EPS callback so the paid voucher can be tested. */
function TestPaymentPanel({
  kind,
  reference,
  total,
}: {
  kind: "booking" | "order";
  reference: string;
  total: number;
}) {
  const qc = useQueryClient();
  const simFn = useServerFn(simulateTestPayment);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("bKash");
  const sim = useMutation({
    mutationFn: (outcome: "success" | "fail") =>
      simFn({ data: { kind, reference, outcome, method } }),
    onSuccess: (r) => {
      if (r.status === "paid") toast.success("Test payment recorded");
      else toast.error("Test payment failed (simulated)");
      void qc.invalidateQueries({ queryKey: ["payment", kind, reference] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-4 rounded-2xl border border-dashed border-border p-4">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        EPS test mode · staff only
      </p>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Live EPS isn't connected yet. Simulate a {bdt(total)} payment. No real money moves.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            aria-pressed={method === m}
            className={`rounded-full border px-3 py-1.5 text-[14px] ${
              method === m
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          disabled={sim.isPending}
          onClick={() => sim.mutate("success")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-2.5 font-semibold text-brand-foreground disabled:opacity-60"
        >
          {sim.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          Simulate success
        </button>
        <button
          disabled={sim.isPending}
          onClick={() => sim.mutate("fail")}
          className="flex-1 rounded-full border border-destructive py-2.5 font-semibold text-destructive disabled:opacity-60"
        >
          Simulate failure
        </button>
      </div>
    </section>
  );
}
