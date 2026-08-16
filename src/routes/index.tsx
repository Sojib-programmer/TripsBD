import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SplashScreen } from "@/components/screens/SplashScreen";
import { TermsScreen } from "@/components/screens/TermsScreen";
import { NotificationScreen } from "@/components/screens/NotificationScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Trips.bd — Hotels, Flights & Activities" },
      {
        name: "description",
        content:
          "Book hotels, flights, homes and activities with Trips.bd. Member deals, VIP status and instant booking from your phone.",
      },
      { property: "og:title", content: "Trips.bd — Hotels, Flights & Activities" },
      {
        property: "og:description",
        content: "Book hotels, flights, homes and activities with Trips.bd.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

type Step = "splash" | "terms" | "notification" | "home";

function Index() {
  const [step, setStep] = useState<Step>("splash");

  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setStep("terms"), 1600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <main className="mx-auto min-h-dvh max-w-[440px] bg-background">
      {step === "splash" && <SplashScreen />}
      {step === "terms" && <TermsScreen onAccept={() => setStep("notification")} />}
      {step === "notification" && <NotificationScreen onDone={() => setStep("home")} />}
      {step === "home" && <HomeScreen />}
    </main>
  );
}
