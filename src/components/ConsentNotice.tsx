import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CONSENT_KEY = "tripsbd.consent.v1";

export function readConsent(): "accepted" | "essential" | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "essential" ? value : null;
}

/**
 * Data-use notice required for the Google Play data safety declaration.
 * Shown once; the choice is stored locally on the device.
 */
export function ConsentNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (value: "accepted" | "essential") => {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Data and cookie notice"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[440px] rounded-t-2xl border border-border bg-card p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl"
    >
      <p className="text-[15px] leading-snug text-foreground">
        We use device storage for sign-in, your search preferences and analytics that help us improve
        Trips.bd. Read our{" "}
        <Link to="/privacy" className="font-semibold text-brand underline underline-offset-2">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" className="font-semibold text-brand underline underline-offset-2">
          Terms
        </Link>
        .
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => choose("essential")}
          className="flex-1 rounded-full border border-border px-4 py-3 text-[15px] font-semibold text-foreground"
        >
          Essential only
        </button>
        <button
          onClick={() => choose("accepted")}
          className="flex-1 rounded-full bg-brand px-4 py-3 text-[15px] font-semibold text-brand-foreground"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
