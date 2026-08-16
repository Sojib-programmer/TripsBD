import { useRouterState } from "@tanstack/react-router";
import { useRef, type ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { tabIndex } from "./nav-tabs";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const index = tabIndex(pathname);
  const prev = useRef(index);
  const forward = index >= prev.current;
  prev.current = index;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background pb-28">
      <div
        key={pathname}
        className={`flex flex-1 flex-col animate-in fade-in duration-300 ease-out motion-reduce:animate-none ${
          forward ? "slide-in-from-right-6" : "slide-in-from-left-6"
        }`}
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-5 pb-4 pt-8">
      <h1 className="font-display text-[30px] font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle ? <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-5 mt-6 flex flex-col items-center rounded-2xl border border-border px-6 py-12 text-center">
      <div className="text-brand">{icon}</div>
      <h2 className="mt-4 text-[19px] font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-[36ch] text-[15px] text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}