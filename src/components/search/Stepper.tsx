import { Minus, Plus } from "lucide-react";

export function Stepper({
  label,
  hint,
  value,
  min = 0,
  max = 20,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[16px] text-foreground">{label}</p>
        {hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="rounded-full border border-border p-2 text-foreground disabled:opacity-30"
        >
          <Minus size={16} />
        </button>
        <span className="w-6 text-center text-[17px] font-semibold text-foreground">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="rounded-full border border-border p-2 text-foreground disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
