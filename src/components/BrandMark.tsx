export function BrandMark({
  size = "md",
  onDark = false,
}: {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const text = {
    sm: "text-[22px]",
    md: "text-[30px]",
    lg: "text-[46px]",
  }[size];
  const dot = {
    sm: "h-[7px] w-[7px]",
    md: "h-[9px] w-[9px]",
    lg: "h-[14px] w-[14px]",
  }[size];
  const gap = { sm: "gap-[3px]", md: "gap-[4px]", lg: "gap-[6px]" }[size];

  return (
    <div className="inline-flex flex-col items-center">
      <span
        className={`${text} font-light lowercase leading-none tracking-tight ${
          onDark ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        trips.bd
      </span>
      <div className={`mt-1.5 flex ${gap}`}>
        <span className={`${dot} rounded-full bg-dot-red`} />
        <span className={`${dot} rounded-full bg-dot-amber`} />
        <span className={`${dot} rounded-full bg-dot-green`} />
        <span className={`${dot} rounded-full bg-dot-purple`} />
        <span className={`${dot} rounded-full bg-dot-cyan`} />
      </div>
    </div>
  );
}