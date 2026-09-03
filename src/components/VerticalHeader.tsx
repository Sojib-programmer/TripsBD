import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function VerticalHeader({
  title,
  summary,
  onEdit,
  right,
}: {
  title: string;
  summary?: string;
  onEdit?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Link to="/" aria-label="Back to home" className="rounded-full p-1 text-foreground">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={!onEdit}
            className="flex w-full min-w-0 flex-col rounded-2xl bg-muted px-4 py-2 text-left disabled:bg-transparent"
          >
            <span className="truncate text-[16px] font-semibold text-foreground">{title}</span>
            {summary ? (
              <span className="truncate text-[13px] font-normal text-muted-foreground">
                {summary}
              </span>
            ) : null}
          </button>
        </h1>
        {right}
      </div>
    </header>
  );
}

export function ChipBar({
  chips,
  active,
  onSelect,
}: {
  chips: { id: string; label: string }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-[14px] font-medium transition-colors ${
            active === c.id
              ? "border-brand bg-brand/10 text-brand"
              : "border-border text-muted-foreground"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
