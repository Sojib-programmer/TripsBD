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
        <path
          fill="var(--brand-foreground)"
          d="M21.02 22.59
             L40.55 22.59
             L40.90 19.30
             L45.34 17.73
             L43.75 23.00
             L41.25 21.55
             C38.90 24.60 35.85 28.30 34.75 33.10
             C34.35 34.90 34.20 36.60 34.20 38.20
             L34.20 45.10
             L26.98 46.98
             L26.98 38.60
             C26.98 34.60 28.30 31.30 30.60 29.65
             L21.02 29.65
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
