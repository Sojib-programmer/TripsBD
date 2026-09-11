import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TOPICS = [
  { value: "booking", label: "A booking request" },
  { value: "account", label: "My account or sign-in" },
  { value: "payment", label: "Payment or refund" },
  { value: "privacy", label: "Privacy or data deletion" },
  { value: "general", label: "Something else" },
];

/**
 * Support enquiries are stored in our own `support_messages` table so that account
 * deletion can actually remove them. Do not move this to a third-party form host.
 */
export function SupportForm() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [topic, setTopic] = useState("booking");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      toast.error("Add your name, email and a message of at least 10 characters.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: user?.id ?? null,
      name: name.trim(),
      email: email.trim(),
      topic,
      order_reference: reference.trim() || null,
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Could not send your message. Please email support@trips.bd.");
      return;
    }
    setSent(true);
    setMessage("");
    toast.success("Message sent — we reply within one business day.");
  };

  if (sent) {
    return (
      <section className="mx-5 rounded-2xl border border-border p-4">
        <p className="text-[15px] text-muted-foreground">
          Thanks — your message is with our team. We reply within one business day. If it is urgent,
          call us on the number below.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-3 text-[15px] font-medium text-brand underline underline-offset-2"
        >
          Send another message
        </button>
      </section>
    );
  }

  const field =
    "mt-2 w-full rounded-xl border border-border bg-background p-3 text-[15px] text-foreground";
  const label = "mt-4 block text-[15px] font-medium text-foreground first:mt-0";

  return (
    <section className="mx-5 rounded-2xl border border-border p-4">
      <label className={label} htmlFor="support-name">
        Your name
      </label>
      <input
        id="support-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={field}
      />

      <label className={label} htmlFor="support-email">
        Email
      </label>
      <input
        id="support-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={field}
      />

      <label className={label} htmlFor="support-topic">
        What is it about?
      </label>
      <select
        id="support-topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className={field}
      >
        {TOPICS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <label className={label} htmlFor="support-ref">
        Booking reference (optional)
      </label>
      <input
        id="support-ref"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className={field}
        placeholder="TBD-XXXXXX"
      />

      <label className={label} htmlFor="support-message">
        Message
      </label>
      <textarea
        id="support-message"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={field}
        placeholder="Tell us what you need help with"
      />

      <button
        onClick={() => void submit()}
        disabled={sending}
        className="mt-4 w-full rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Your message is stored in our own systems and deleted when you delete your account.
      </p>
    </section>
  );
}
