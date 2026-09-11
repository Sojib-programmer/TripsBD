import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { createOrder } from "@/lib/orders.functions";

type Vertical = "stay" | "flight" | "activity" | "transfer";

/**
 * Until contracted supplier inventory is loaded, each vertical takes a real request
 * instead of showing catalogue rows. This writes a genuine `orders` row that our team
 * sources by hand — no price is promised and nothing is presented as available.
 */
export function RequestPanel({
  vertical,
  heading,
  summary,
  startsAt,
  defaultTravellers = 1,
  details,
}: {
  vertical: Vertical;
  heading: string;
  summary: string;
  startsAt: string;
  defaultTravellers?: number;
  details?: Record<string, unknown>;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const submit = useServerFn(createOrder);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [travellers, setTravellers] = useState(defaultTravellers);

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          vertical,
          title: heading,
          subtitle: summary,
          startsAt: new Date(`${startsAt}T00:00:00Z`).toISOString(),
          travellers,
          totalBdt: 0,
          contactName: name.trim(),
          contactEmail: email.trim(),
          contactPhone: phone.trim() || undefined,
          details: { ...(details ?? {}), note: note.trim() },
        },
      }),
    onSuccess: (order) => {
      toast.success(`Request sent · ${order.reference}`);
      void navigate({ to: "/order/$reference", params: { reference: order.reference } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "mt-2 w-full rounded-xl border border-border bg-background p-3 text-[15px] text-foreground";
  const label = "mt-4 block text-[15px] font-medium text-foreground first:mt-0";

  if (!user) {
    return (
      <section className="rounded-2xl border border-border p-4">
        <h2 className="text-[19px] font-semibold text-foreground">Tell us what you need</h2>
        <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
          We do not list unverified availability. Sign in and send a request — our team checks with
          the supplier and comes back with a real price, usually within one business day.
        </p>
        <button
          onClick={() => void navigate({ to: "/auth" })}
          className="mt-4 w-full rounded-full bg-brand py-3 text-[17px] font-semibold text-brand-foreground"
        >
          Sign in to send a request
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border p-4">
      <h2 className="text-[19px] font-semibold text-foreground">Tell us what you need</h2>
      <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
        {summary}. Our team checks availability with the supplier and replies with a confirmed
        price, usually within one business day. Nothing is charged in the app.
      </p>

      <label className={label} htmlFor="req-name">
        Your name
      </label>
      <input
        id="req-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={field}
      />

      <label className={label} htmlFor="req-email">
        Email
      </label>
      <input
        id="req-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={field}
      />

      <label className={label} htmlFor="req-phone">
        Phone (optional)
      </label>
      <input
        id="req-phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={field}
      />

      <label className={label} htmlFor="req-travellers">
        Travellers
      </label>
      <input
        id="req-travellers"
        type="number"
        min={1}
        max={20}
        value={travellers}
        onChange={(e) => setTravellers(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
        className={field}
      />

      <label className={label} htmlFor="req-note">
        Anything else we should know?
      </label>
      <textarea
        id="req-note"
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={field}
        placeholder="Budget, preferred area, timings…"
      />

      <button
        onClick={() => {
          if (name.trim().length < 2 || !email.includes("@")) {
            toast.error("Add your name and a valid email.");
            return;
          }
          mutation.mutate();
        }}
        disabled={mutation.isPending}
        className="mt-4 w-full rounded-full bg-brand py-3 text-[17px] font-semibold text-brand-foreground disabled:opacity-50"
      >
        {mutation.isPending ? "Sending…" : "Send request"}
      </button>
    </section>
  );
}
