import { Link } from "@tanstack/react-router";
import { Home, Briefcase, Tag, Heart, User } from "lucide-react";

const tabs: { to: string; icon: typeof Home; label: string; badge?: boolean }[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/trips", icon: Briefcase, label: "My Trips" },
  { to: "/deals", icon: Tag, label: "Deals", badge: true },
  { to: "/saved", icon: Heart, label: "Saved" },
  { to: "/more", icon: User, label: "More" },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-[440px] grid-cols-5 border-t border-border bg-background/95 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur"
    >
      {tabs.map(({ to, icon: Icon, label, badge }) => (
        <Link
          key={to}
          to={to as never}
          activeOptions={{ exact: to === "/" }}
          className="flex flex-col items-center gap-1 text-muted-foreground"
          activeProps={{ className: "!text-brand" }}
        >
          <span className="relative">
            <Icon size={23} />
            {badge ? (
              <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-dot-red" />
            ) : null}
          </span>
          <span className="text-[12px] font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  );
}