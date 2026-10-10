import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { listStaffMembers, setStaffRole } from "@/lib/ops.functions";

export const Route = createFileRoute("/staff")({
  component: StaffPage,
  head: () => ({
    meta: [
      { title: "Staff access — Trips.bd" },
      { name: "description", content: "Admins grant and revoke Trips.bd ops and admin roles." },
      { property: "og:title", content: "Staff access — Trips.bd" },
      { property: "og:description", content: "Manage Trips.bd staff roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function StaffPage() {
  const { user } = useAuth();
  const listFn = useServerFn(listStaffMembers);
  const setFn = useServerFn(setStaffRole);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ops" | "admin">("ops");
  const q = useQuery({
    queryKey: ["staff"],
    queryFn: () => listFn(),
    enabled: !!user,
    retry: false,
  });
  const m = useMutation({
    mutationFn: (v: { email: string; role: "ops" | "admin"; grant: boolean }) => setFn({ data: v }),
    onSuccess: () => {
      toast.success("Staff access updated");
      setEmail("");
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader title="Staff access" subtitle="Admins only" />
      <div className="space-y-6 px-5 pb-12">
        {!user ? (
          <p className="text-muted-foreground">Sign in with an admin account to manage staff.</p>
        ) : q.isError ? (
          <p className="text-muted-foreground">Only admins can manage staff.</p>
        ) : (
          <>
            <form
              className="space-y-3 rounded-2xl border border-border p-4"
              onSubmit={(e) => {
                e.preventDefault();
                m.mutate({ email, role, grant: true });
              }}
            >
              <p className="text-[14px] text-muted-foreground">
                The person must already have a Trips.bd account (sign up at /auth).
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ops" | "admin")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2"
              >
                <option value="ops">Ops — confirm requests, record refunds</option>
                <option value="admin">Admin — ops plus manage staff</option>
              </select>
              <button
                disabled={m.isPending}
                className="w-full rounded-xl bg-brand px-4 py-2.5 font-semibold text-brand-foreground"
              >
                Grant role
              </button>
            </form>
            <ul className="space-y-2">
              {(q.data ?? []).map((s) => (
                <li key={s.userId} className="rounded-2xl border border-border p-3">
                  <p className="font-semibold text-foreground">{s.name || s.email || s.userId}</p>
                  <p className="text-[13px] text-muted-foreground">{s.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.roles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          s.email &&
                          m.mutate({ email: s.email, role: r as "ops" | "admin", grant: false })
                        }
                        className="rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold"
                      >
                        {r} ✕
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
