import { Briefcase, Heart, Home, Tag, User } from "lucide-react";

/** Left-to-right tab order — drives both the tab bar and transition direction. */
export const TABS = [
  { to: "/", icon: Home, label: "Home", badge: false as boolean },
  { to: "/trips", icon: Briefcase, label: "My Trips", badge: false as boolean },
  { to: "/deals", icon: Tag, label: "Deals", badge: true as boolean },
  { to: "/saved", icon: Heart, label: "Saved", badge: false as boolean },
  { to: "/more", icon: User, label: "More", badge: false as boolean },
] as const;

export function tabIndex(pathname: string) {
  const i = TABS.findIndex((t) => t.to !== "/" && pathname.startsWith(t.to));
  return i === -1 ? 0 : i;
}
