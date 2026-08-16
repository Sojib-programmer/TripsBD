import duskCoast from "@/assets/dusk-coast.jpg";
import { BrandMark } from "../BrandMark";
import { StatusBar } from "../StatusBar";

export function TermsScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <img
        src={duskCoast}
        alt="Dusk over a coastline with sea stacks"
        width={832}
        height={1600}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[oklch(0.15_0.04_265/0.35)]" />
      <div className="relative flex min-h-dvh flex-col">
        <StatusBar dark />
        <div className="px-6 pt-8">
          <BrandMark size="md" onDark />
          <p className="mt-7 text-[19px] leading-snug text-primary-foreground/90">
            By using our app, you acknowledge our{" "}
            <a href="/terms" className="font-semibold underline underline-offset-2">
              Terms of Use
            </a>{" "}
            and our{" "}
            <a href="/privacy" className="font-semibold underline underline-offset-2">
              Privacy and Cookie Policy
            </a>
            .
          </p>
        </div>
        <div className="mt-auto px-6 pb-14">
          <button
            onClick={onAccept}
            className="rounded-xl bg-brand px-8 py-4 text-[19px] font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}