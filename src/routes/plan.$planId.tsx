import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Map } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/AppShell";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PlanView } from "@/components/planner/PlanView";
import { useAuth } from "@/hooks/useAuth";
import { deleteSpot, getPlan, moveSpot, sendPlannerMessage } from "@/lib/planner.functions";

export const Route = createFileRoute("/plan/$planId")({
  component: PlanChat,
  head: () => ({
    meta: [
      { title: "Your trip plan — Trips.bd" },
      {
        name: "description",
        content:
          "Chat with the Trips.bd planner to build and edit a day-by-day itinerary, then turn matching stays and activities into booking requests.",
      },
      { property: "og:title", content: "Your trip plan — Trips.bd" },
      {
        property: "og:description",
        content: "Build and edit a day-by-day itinerary with the Trips.bd planner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SUGGESTIONS = [
  "4 days in Cox's Bazar, beachfront, seafood, mid-budget",
  "A long weekend in Sylhet with tea gardens and hiking",
  "3 days in Dhaka — old city, food and museums",
];

function PlanChat() {
  const { planId } = useParams({ from: "/plan/$planId" });
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const fetchPlan = useServerFn(getPlan);
  const send = useServerFn(sendPlannerMessage);
  const removeSpot = useServerFn(deleteSpot);
  const relocateSpot = useServerFn(moveSpot);

  const [tab, setTab] = useState<"chat" | "plan">("chat");
  const [text, setText] = useState("");
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const plan = useQuery({
    queryKey: ["trip-plan", planId],
    queryFn: () => fetchPlan({ data: { planId } }),
    enabled: Boolean(user),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["trip-plan", planId] });
    void queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
  };

  const ask = useMutation({
    mutationFn: (message: string) => send({ data: { planId, message } }),
    onSuccess: (res) => {
      setPendingUser(null);
      invalidate();
      if (res.limited) toast.message(res.message);
      else if (res.action === "generate" || res.action === "patch") setTab("plan");
    },
    onError: (e: Error) => {
      setPendingUser(null);
      toast.error(e.message);
    },
  });

  const dropSpot = useMutation({
    mutationFn: (spotId: string) => removeSpot({ data: { spotId } }),
    onSuccess: invalidate,
    onError: () => toast.error("Could not remove that place"),
  });

  const moveTo = useMutation({
    mutationFn: (v: { spotId: string; dayId: string }) =>
      relocateSpot({ data: { ...v, slotIndex: 0 } }),
    onSuccess: invalidate,
    onError: () => toast.error("Could not move that place"),
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [planId, ask.isPending]);

  const submit = (value: string) => {
    const message = value.trim();
    if (!message || ask.isPending) return;
    setText("");
    setPendingUser(message);
    ask.mutate(message);
  };

  if (!user && !loading) {
    return (
      <div className="mx-auto max-w-[440px] px-5 py-10">
        <EmptyState
          icon={<Map size={34} />}
          title="Sign in to plan a trip"
          body="Your plans are saved to your account so you can pick them up on any device."
          action={
            <Link
              to="/auth"
              className="rounded-full bg-brand px-6 py-3 text-[17px] font-semibold text-brand-foreground"
            >
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  const data = plan.data;
  const messages = data?.messages ?? [];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/plan" aria-label="Back to plans" className="text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-foreground">
            {data?.plan.title ?? "New trip"}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">
            {data?.plan.destination ?? "Trip planner"}
          </p>
        </div>
        <div className="flex rounded-full border border-border p-0.5 text-[13px]">
          {(["chat", "plan"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 capitalize ${
                tab === t ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === "plan" ? (
        <div className="flex-1 overflow-y-auto">
          {data ? (
            <PlanView
              plan={data.plan}
              days={data.days}
              spots={data.spots}
              onDeleteSpot={(spotId) => dropSpot.mutate(spotId)}
              onMoveSpot={(spotId, dayId) => moveTo.mutate({ spotId, dayId })}
            />
          ) : null}
        </div>
      ) : (
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 px-4 py-4">
            {messages.length === 0 && !pendingUser ? (
              <div className="pt-6">
                <p className="text-[17px] font-semibold text-foreground">
                  Where are you going?
                </p>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  Describe the trip in a sentence and I will build a day-by-day plan.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-xl border border-border px-3 py-2 text-left text-[15px] text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m) => (
              <Message key={m.id} from={m.role === "assistant" ? "assistant" : "user"}>
                <MessageContent>
                  <MessageResponse>{m.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))}

            {pendingUser ? (
              <Message from="user">
                <MessageContent>
                  <MessageResponse>{pendingUser}</MessageResponse>
                </MessageContent>
              </Message>
            ) : null}

            {ask.isPending ? <Shimmer>Planning your trip…</Shimmer> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div className="border-t border-border p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            submit(message.text ?? text);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask for a plan, or an edit like 'add a sunset point to day 2'"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={ask.isPending ? "submitted" : undefined}
              disabled={ask.isPending || text.trim().length < 2}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
