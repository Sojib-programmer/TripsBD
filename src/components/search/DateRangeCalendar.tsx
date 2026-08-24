import { useMemo } from "react";

import { toISODate, today } from "@/lib/format";

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: start }, () => null);
  for (let d = 1; d <= days; d += 1) cells.push(toISODate(new Date(year, month, d)));
  return cells;
}

/**
 * Scrollable multi-month calendar. When `single` is set it behaves as a
 * one-date picker (activities, transfers, trains); otherwise it selects a range.
 */
export function DateRangeCalendar({
  start,
  end,
  onChange,
  single = false,
  months = 3,
}: {
  start: string;
  end?: string;
  onChange: (start: string, end?: string) => void;
  single?: boolean;
  months?: number;
}) {
  const min = today();
  const grids = useMemo(() => {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return {
        label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        cells: monthMatrix(d.getFullYear(), d.getMonth()),
      };
    });
  }, [months]);

  const pick = (iso: string) => {
    if (single) return onChange(iso, undefined);
    if (!start || (start && end) || iso < start) return onChange(iso, undefined);
    if (iso === start) return onChange(iso, undefined);
    return onChange(start, iso);
  };

  return (
    <div className="max-h-[46dvh] overflow-y-auto pr-1">
      {grids.map((g) => (
        <div key={g.label} className="mb-4">
          <p className="mb-2 text-[15px] font-semibold text-foreground">{g.label}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}${i}`}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {g.cells.map((iso, i) => {
              if (!iso) return <span key={`e${i}`} />;
              const disabled = iso < min;
              const isStart = iso === start;
              const isEnd = Boolean(end) && iso === end;
              const inRange = Boolean(end) && iso > start && iso < (end ?? "");
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(iso)}
                  className={`h-10 rounded-lg text-[15px] transition-colors ${
                    isStart || isEnd
                      ? "bg-brand font-semibold text-brand-foreground"
                      : inRange
                        ? "bg-brand/10 text-foreground"
                        : disabled
                          ? "text-muted-foreground/40"
                          : "text-foreground"
                  }`}
                >
                  {Number(iso.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
