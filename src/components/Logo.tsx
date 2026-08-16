type LogoProps = {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  markOnly?: boolean;
  className?: string;
};

const SIZES = {
  sm: { mark: 28, text: "text-[19px]", radius: 8 },
  md: { mark: 36, text: "text-[25px]", radius: 10 },
  lg: { mark: 64, text: "text-[44px]", radius: 18 },
} as const;

/**
 * Trips.bd identity mark.
 * The glyph is a "T" whose stem resolves into a flight path arc ending in a
 * location pin — travel (route) and destination (pin) in one continuous form.
 */
export function Logo({ size = "md", onDark = false, markOnly = false, className = "" }: LogoProps) {
  const s = SIZES[size];
  const gid = `trips-mark-${size}${onDark ? "-d" : ""}`;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
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
        <rect width="64" height="64" rx={s.radius * (64 / s.mark) / (64 / s.mark)} fill="none" />
        <rect width="64" height="64" rx="18" fill={`url(#${gid})`} />
        {/* T crossbar */}
        <rect x="14" y="17" width="36" height="6.5" rx="3.25" fill="var(--brand-foreground)" />
        {/* stem curving into a route */}
        <path
          d="M32 23.5v13c0 6 4.5 8 9 9.5"
          stroke="var(--brand-foreground)"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* destination dot */}
        <circle cx="44.5" cy="46.5" r="4.6" fill="var(--brand-foreground)" />
        <circle cx="44.5" cy="46.5" r="1.9" fill={`url(#${gid})`} />
        {/* departure tick */}
        <circle cx="22" cy="46.5" r="3.2" fill="var(--brand-foreground)" fillOpacity="0.55" />
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