import { Link } from "@tanstack/react-router";

import { TABS } from "./nav-tabs";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-[440px] grid-cols-5 border-t border-border bg-background/95 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur"
    >
      {TABS.map(({ to, icon: Icon, label, badge }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          className="group flex flex-col items-center gap-1 text-muted-foreground transition-colors duration-200"
          activeProps={{ className: "!text-brand" }}
        >
          <span className="relative transition-transform duration-200 ease-out group-active:scale-90 group-data-[status=active]:-translate-y-0.5">
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
