import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";

/** Opens the in-app voice call room for a booking/order reference. */
export function CallLink({
  reference,
  label = "Call Trips.bd about this booking",
}: {
  reference: string;
  label?: string;
}) {
  return (
    <Link
      to="/call/$reference"
      params={{ reference }}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-[15px] font-semibold text-foreground"
    >
      <Phone size={16} /> {label}
    </Link>
  );
}
