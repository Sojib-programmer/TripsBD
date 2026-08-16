import { X, BriefcaseBusiness, Siren, HandCoins } from "lucide-react";

import mascot from "@/assets/mascot-notify.png";

const perks = [
  { icon: BriefcaseBusiness, label: "Get booking reminders" },
  { icon: Siren, label: "Important alerts" },
  { icon: HandCoins, label: "Notify me of all the best deals" },
];

export function NotificationScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="relative flex items-center justify-center border-b border-border px-5 pb-4 pt-3">
        <button onClick={onDone} aria-label="Close" className="absolute left-4 text-foreground">
          <X size={30} strokeWidth={2.2} />
        </button>
        <h1 className="text-[21px] font-bold text-foreground">Notification</h1>
      </header>

      <div className="flex flex-1 flex-col px-6">
        <img
          src={mascot}
          alt="Mascot holding a phone with notifications turned on"
          width={1024}
          height={1024}
          className="mx-auto mt-6 w-[74%] max-w-[300px]"
        />
        <h2 className="mt-2 text-[26px] font-bold tracking-tight text-foreground">
          Don't miss out!
        </h2>
        <p className="mt-2 text-[17px] text-foreground">
          Let the Trips.bd app do the work for you.
        </p>

        <ul className="mt-6 space-y-5">
          {perks.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-4">
              <Icon size={28} strokeWidth={1.8} className="shrink-0 text-foreground" />
              <span className="text-[17px] text-foreground">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pb-10 pt-8">
          <button
            onClick={onDone}
            className="w-full rounded-full bg-brand py-4 text-[19px] font-bold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Turn on notifications
          </button>
          <button
            onClick={onDone}
            className="mt-4 w-full text-center text-[17px] font-medium text-brand"
          >
            No, thanks
          </button>
        </div>
      </div>
    </div>
  );
}