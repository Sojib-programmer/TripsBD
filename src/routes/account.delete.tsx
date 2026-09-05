import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { deleteMyAccountNow, getMyDeletionRequest } from "@/lib/compliance.functions";

export const Route = createFileRoute("/account/delete")({
  component: DeleteAccountPage,
  head: () => ({
    meta: [
      { title: "Delete your account — Trips.bd" },
      {
        name: "description",
        content:
          "Request permanent deletion of your Trips.bd account and personal data, and see exactly what is deleted and what we must retain.",
      },
      { property: "og:title", content: "Delete your account — Trips.bd" },
      { property: "og:description", content: "Request account and data deletion from Trips.bd." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DeleteAccountPage() {
  const { user } = useAuth();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const deleteNow = useServerFn(deleteMyAccountNow);
  const fetchExisting = useServerFn(getMyDeletionRequest);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");

  const existing = useQuery({
    queryKey: ["deletion-request"],
    queryFn: () => fetchExisting(),
    enabled: Boolean(user),
  });

  const mutation = useMutation({
    mutationFn: () =>
      deleteNow({ data: { confirm: "DELETE" as const, reason: reason.trim() || undefined } }),
    onSuccess: async () => {
      toast.success("Your account and personal data have been deleted.");
      queryClient.clear();
      await signOut();
      void navigate({ to: "/" });
    },
    onError: () => toast.error("Could not delete the account. Please try again or email us."),
  });


  return (
    <AppShell>
      <PageHeader title="Delete your account" subtitle="Account and data deletion request" />

      <div className="px-5 pb-10">
        <section className="rounded-2xl border border-border p-4">
          <h2 className="text-[17px] font-semibold text-foreground">What gets deleted</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-muted-foreground">
            <li>Your login and authentication records</li>
            <li>Your profile: name, phone, avatar and VIP tier</li>
            <li>Saved listings, searches and notification history</li>
            <li>Support messages linked to your account</li>
          </ul>
          <h2 className="mt-5 text-[17px] font-semibold text-foreground">What we must keep</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-muted-foreground">
            <li>
              Booking amounts and references, retained in anonymised form (no name, email or
              phone) for up to 6 years
              for tax, accounting and consumer-protection law in Bangladesh.
            </li>
          </ul>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Deletion is permanent and cannot be undone. Active or upcoming bookings must be completed
            or cancelled first. See our{" "}
            <Link to="/privacy" className="font-semibold text-brand underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        {!user ? (
          <section className="mt-5 rounded-2xl border border-border p-4">
            <p className="text-[15px] text-muted-foreground">
              Sign in to request deletion from inside the app, or email{" "}
              <a
                href="mailto:privacy@trips.bd?subject=Account%20deletion%20request"
                className="font-semibold text-brand underline underline-offset-2"
              >
                privacy@trips.bd
              </a>{" "}
              from the address on your account. We verify ownership before deleting anything.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground"
            >
              Sign in
            </Link>
          </section>
        ) : existing.data ? (
          <section className="mt-5 flex gap-3 rounded-2xl border border-border p-4">
            <ShieldAlert size={22} className="mt-0.5 shrink-0 text-dot-amber" />
            <p className="text-[15px] text-muted-foreground">
              A deletion request for <span className="text-foreground">{user.email}</span> is{" "}
              {existing.data.status}. If it has not completed, email privacy@trips.bd and we will
              finish it within 30 days.
            </p>
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-border p-4">
            <label className="block text-[15px] font-medium text-foreground" htmlFor="reason">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-[15px] text-foreground"
              placeholder="Tell us why you're leaving"
            />
            <label className="mt-4 block text-[15px] font-medium text-foreground" htmlFor="confirm">
              Type DELETE to confirm
            </label>
            <input
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-[15px] text-foreground"
              placeholder="DELETE"
            />
            <button
              disabled={confirm !== "DELETE" || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="mt-4 w-full rounded-full bg-destructive px-6 py-3 text-[17px] font-semibold text-destructive-foreground disabled:opacity-50"
            >
              {mutation.isPending ? "Deleting…" : "Delete my account permanently"}
            </button>
          </section>
        )}
      </div>
    </AppShell>
  );
}
