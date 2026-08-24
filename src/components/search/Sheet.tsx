import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Agoda-style bottom sheet used by every vertical's search entry. */
export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
      />
      <div
        role="dialog"
        aria-label={title}
        className="relative flex max-h-[88dvh] w-full max-w-[440px] flex-col rounded-t-3xl bg-background animate-in slide-in-from-bottom duration-300 ease-out motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[19px] font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-full p-1 text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block py-3">
      <span className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-[16px] text-foreground outline-none focus:border-brand";
