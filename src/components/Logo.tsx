type LogoProps = {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  markOnly?: boolean;
  className?: string;
};

const SIZES = {
  sm: { mark: 30, text: "text-[19px]" },
  md: { mark: 38, text: "text-[25px]" },
  lg: { mark: 64, text: "text-[44px]" },
} as const;

/**
 * Trips.bd identity mark — vector twin of the installed app icon:
 * a "T" whose stem sweeps upward into a flight-path arrow.
 */
export function Logo({ size = "md", onDark = false, markOnly = false, className = "" }: LogoProps) {
  const s = SIZES[size];
  const gid = `trips-mark-${size}${onDark ? "-d" : ""}`;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Trips.bd"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-from)" />
            <stop offset="100%" stopColor="var(--brand-to)" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill={`url(#${gid})`} />
        {/* crossbar of the T */}
        <path
          fill="var(--brand-foreground)"
          d="M21.02 22.90 L39.22 22.90 L28.00 29.33 L21.02 29.33 Z"
        />
        {/* stem sweeping into the flight-path arrow */}
        <path
          fill="var(--brand-foreground)"
          d="M34.20 45.10
             C34.20 40.00 34.30 34.00 35.92 30.27
             C37.20 27.60 39.00 25.00 41.33 22.43
             L43.65 22.95
             L45.34 17.73
             L40.70 19.40
             L40.78 22.43
             C38.60 24.60 36.30 26.90 34.20 28.71
             C31.00 31.80 27.80 35.20 26.98 39.69
             L26.98 46.98
             Z"
        />
      </svg>

      {markOnly ? null : (
        <span
          className={`font-display ${s.text} font-semibold leading-none tracking-[-0.03em] ${
            onDark ? "text-primary-foreground" : "text-foreground"
          }`}
        >
          Trips
          <span className="text-brand">.bd</span>
        </span>
      )}
    </span>
  );
}
