import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useStandalone } from "@/hooks/useStandalone";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "tripsbd.install.dismissed";

export function InstallPrompt() {
  const standalone = useStandalone();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setHidden(false);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setDeferred(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || hidden || !deferred) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-[420px] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
      <Download size={22} className="shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-foreground">Install Trips.bd</p>
        <p className="text-[13px] text-muted-foreground">Full-screen app, one tap from your home screen.</p>
      </div>
      <button
        onClick={() => {
          void deferred.prompt().then(() => {
            void deferred.userChoice.finally(() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setDeferred(null);
            });
          });
        }}
        className="rounded-full bg-brand px-4 py-2 text-[14px] font-semibold text-brand-foreground"
      >
        Install
      </button>
      <button onClick={dismiss} aria-label="Dismiss install prompt" className="text-muted-foreground">
        <X size={18} />
      </button>
    </div>
  );
}
