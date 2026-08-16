import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { TermsScreen } from "@/components/screens/TermsScreen";
import { NotificationScreen } from "@/components/screens/NotificationScreen";
import { markOnboarded } from "@/lib/onboarding";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
  head: () => ({
    meta: [
      { title: "Welcome to Trips.bd" },
      { name: "description", content: "Get started with Trips.bd: accept the terms and turn on deal alerts for hotels, flights and activities." },
      { property: "og:title", content: "Welcome to Trips.bd" },
      { property: "og:description", content: "Get started with Trips.bd in two quick steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function WelcomePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"terms" | "notification">("terms");

  const finish = () => {
    markOnboarded();
    void navigate({ to: "/" });
  };

  return (
    <main className="mx-auto min-h-dvh max-w-[440px] bg-background">
      {step === "terms" ? (
        <TermsScreen onAccept={() => setStep("notification")} />
      ) : (
        <NotificationScreen onDone={finish} />
      )}
    </main>
  );
}
