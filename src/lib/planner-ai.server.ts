import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

export const SPOT_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "attraction",
  "museum",
  "park",
  "shopping",
  "entertainment",
  "hotel",
  "transit",
  "beach",
  "nightlife",
] as const;

const spotSchema = z.object({
  name: z.string().max(120),
  type: z.enum(SPOT_TYPES),
  typeLabel: z.string().max(60).nullable(),
  address: z.string().max(200).nullable(),
  dayDate: z.string().max(10),
  slotIndex: z.number().int().min(0).max(30),
});

export const plannerSchema = z.object({
  content: z.string().max(1200),
  action: z.enum(["ask", "generate", "patch", "none"]),
  tripPlan: z
    .object({
      title: z.string().max(90),
      destination: z.string().max(90),
      startDate: z.string().max(10),
      endDate: z.string().max(10),
      heroPhotoUrl: z.string().max(400).nullable(),
      spots: z.array(spotSchema).max(80),
    })
    .nullable(),
  patch: z
    .object({
      addSpots: z.array(spotSchema).max(30),
      removeSpotNames: z.array(z.string().max(120)).max(30),
      addDayDates: z.array(z.string().max(10)).max(14),
      removeDayDates: z.array(z.string().max(10)).max(14),
    })
    .nullable(),
});

export type PlannerResult = z.infer<typeof plannerSchema>;
export type PlannerSpot = z.infer<typeof spotSchema>;

const SYSTEM = `You are the Trips.bd trip planner, a concise travel planning assistant for travellers in and around Bangladesh.

Rules:
- Today's date is provided in the user context. Never plan dates in the past.
- If the traveller has not given you a destination or a length of stay, set action "ask" and ask one short question.
- When you have enough to build an itinerary, set action "generate" and return a complete tripPlan: a short title, the destination, startDate and endDate as YYYY-MM-DD, and spots covering every day between those dates.
- Each spot has a real place name, a type from the allowed list, a short human typeLabel (e.g. "Seafood restaurant"), an address when you know one, the dayDate it belongs to, and a slotIndex ordering it within that day (0 = first).
- When the traveller asks for an edit to an existing plan, set action "patch" and only return what changes.
- heroPhotoUrl must be an https://images.unsplash.com/ URL or null.
- Trips.bd is a request-to-book service. Never claim a place is available, bookable at a given price, or confirmed. Keep prices out of the plan.
- Keep "content" under 60 words, warm and practical, no markdown headings.
- Set action "none" for small talk.`;

export async function runPlanner(input: {
  today: string;
  planSummary: string | null;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<PlannerResult> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("The trip planner is not configured yet.");

  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const context = [
    `Today is ${input.today}.`,
    input.planSummary ? `Current saved plan:\n${input.planSummary}` : "No plan saved yet.",
  ].join("\n");

  const result = streamText({
    model: lovable.responses("openai/gpt-6-astra"),
    system: `${SYSTEM}\n\n${context}`,
    messages: input.history,
    output: Output.object({ schema: plannerSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return await result.output;
}
