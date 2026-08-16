export function StatusBar({ dark = false }: { dark?: boolean }) {
  const tone = dark ? "text-white" : "text-foreground";
  return (
    <div className={`flex items-center justify-between px-7 pt-3 pb-1 ${tone}`}>
      <span className="text-[17px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
          <path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0L8 11.2Z" />
          <path
            d="M3.4 6.4a6.6 6.6 0 0 1 9.2 0"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M1 3.9a10 10 0 0 1 14 0"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden="true">
          <rect
            x="0.6"
            y="0.6"
            width="22"
            height="11.8"
            rx="3.6"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.2"
          />
          <rect x="2.2" y="2.2" width="18.8" height="8.6" rx="2.4" fill="currentColor" />
          <path d="M24.2 4.4v4.2a2.4 2.4 0 0 0 0-4.2Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}