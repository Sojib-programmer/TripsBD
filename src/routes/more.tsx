import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  LifeBuoy,
  LogOut,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile } from "@/lib/account.functions";
import { signOut } from "@/lib/auth";

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
];

function MorePage() {
  const { user } = useAuth();
  const fetchProfile = useServerFn(getMyProfile);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    enabled: Boolean(user),
  });

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    toast.success("Signed out");
    void navigate({ to: "/" });
  };

  const name = profile.data?.full_name ?? user?.email ?? "";
  const initial = (name || "T").charAt(0).toUpperCase();

  return (
    <AppShell>
      <PageHeader title="More" subtitle="Account and app settings" />

      {user ? (
        <section className="mx-5 flex items-center gap-4 rounded-2xl border border-border p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-[22px] font-semibold text-brand-foreground">
            {profile.data?.avatar_url ? (
              <img
                src={profile.data.avatar_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[19px] font-semibold text-foreground">{name}</p>
            <p className="text-[15px] text-muted-foreground">
              VIP {profile.data?.vip_tier ?? "Bronze"}
            </p>
          </div>
        </section>
      ) : (
        <section className="mx-5 rounded-2xl border border-border p-4">
          <Logo size="sm" />
          <p className="mt-3 text-[15px] text-muted-foreground">
            Sign in to sync bookings across devices and unlock VIP member prices.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground"
          >
            Login / Sign up
          </Link>
        </section>
      )}

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
        <li>
          <Link to="/host" className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <Building2 size={22} className="text-brand" />
            <span className="flex-1 text-[17px] text-foreground">List your property</span>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link to="/support" className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <LifeBuoy size={22} className="text-brand" />
            <span className="flex-1 text-[17px] text-foreground">Help centre</span>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link to="/privacy" className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <Shield size={22} className="text-brand" />
            <span className="flex-1 text-[17px] text-foreground">Privacy Policy</span>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link to="/terms" className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <FileText size={22} className="text-brand" />
            <span className="flex-1 text-[17px] text-foreground">Terms of Use</span>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link to="/account/delete" className="flex w-full items-center gap-3 px-5 py-4 text-left">
            <Trash2 size={22} className="text-destructive" />
            <span className="flex-1 text-[17px] text-foreground">Delete my account</span>
            <ChevronRight size={20} className="text-muted-foreground" />
          </Link>
        </li>
        {user ? (
          <li>
            <button
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <LogOut size={22} className="text-destructive" />
              <span className="flex-1 text-[17px] text-destructive">Sign out</span>
            </button>
          </li>
        ) : null}
      </ul>
    </AppShell>
  );
}
