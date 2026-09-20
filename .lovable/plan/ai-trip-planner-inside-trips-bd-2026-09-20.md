# AI Trip Planner inside Trips.bd

Bring the "Trip Planner" project's AI planning experience into Trips.bd: the traveller describes a trip in plain language, the assistant asks at most one clarifying question, then writes a full day-by-day plan the traveller can edit — and anything in the plan that Trips.bd actually sells becomes a booking request.

## What the traveller gets

- A **Plan a trip** card on Home and a **Plan a trip** action on Trips.
- A chat screen per trip plan: type "4 days in Cox's Bazar, beachfront, seafood, mid-budget" and get a titled plan with a cover photo, one section per day, and places with type, label and address.
- Each plan is saved to the account, listed alongside bookings, and editable by chat ("add a sunset point to day 2", "drop the museum", "make it 5 days") or by hand (rename, reorder within a day, move between days, delete a day or a place).
- Where a planned stay or activity matches real Trips.bd inventory, the row shows a **Book** action that carries straight into the existing request-to-book flow (`/listing/$slug`, `/activities/$slug`). Everything else stays advisory — no invented availability or prices.
- Free tier: 5 assistant messages per day and 3 saved plans, using the `usage_counters` table already in the database. Hitting a limit shows a clear message, not an error.

## Data

New tables, all owner-scoped RLS (`auth.uid() = user_id`), grants to `authenticated` + `service_role`, no anon access:

- `trip_plans` — title, destination, start/end date, hero photo URL, status.
- `trip_plan_days` — plan, date, order.
- `trip_plan_spots` — plan, day, name, spot type, type label, address, slot index, plus nullable `listing_id` / `activity_id` for inventory matches.
- `trip_plan_messages` — plan, role, content, structured payload, created_at.

`spot_type` enum: restaurant, cafe, bar, attraction, museum, park, shopping, entertainment, hotel, transit, beach, nightlife. A trigger enforces the 3-plan free cap server-side; `increment_messages_today()` already exists for the message cap.

## Routes

```text
/plan             plan list + new-plan composer
/plan/$planId     chat + live plan canvas (mobile: two tabs, Chat | Plan)
```

Both sit under the authenticated layout — plans are personal. Home and Trips link in.

## Backend

A single `createServerFn` chat endpoint (`src/lib/planner.functions.ts`) with `requireSupabaseAuth`, calling the Lovable AI Gateway with the Roamie-style JSON contract from the source project: `content` + `action` (`ask | generate | patch | regenerate | recommend | none`) + `tripPlan | patch | recommendations`. The handler validates the model output with Zod, applies it to the tables in one transactional path, and returns the updated plan. No Supabase Edge Function — this stack uses server functions.

Inventory matching runs server-side after generation: hotel/beach/attraction spots are matched by name and city against `listings` and `activities`; a hit stores the id so the UI can offer Book.

Model output is untrusted: only whitelisted spot types, date strings inside the plan range, Unsplash-host hero URLs, and length caps are accepted.

## Chat UI

Built from AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`) installed into `src/components/ai-elements/`, styled with the existing Trips.bd tokens. Assistant messages render on the page surface with no coloured bubble; user messages use the primary token pair. Optimistic user message plus a "Planning your trip…" shimmer while the model works, and a plan skeleton in the canvas during first generation. The planner gets its own mark, not a generic sparkle icon.

## Order of work

1. Migration: tables, enum, RLS, grants, plan-cap trigger.
2. AI Elements install + planner server function and schema validation.
3. `/plan` and `/plan/$planId` with chat, plan canvas, manual CRUD.
4. Inventory matching + Book actions into the existing request flow.
5. Home and Trips entry points, free-limit messaging.
6. Typecheck, lint, tests, and a headless pass: create a plan, patch it, reload, book a matched spot.

## Out of scope

No payments (matched items still go through request-to-book), no live supplier availability, no maps, no sharing of plans between users. Play Store scope is unaffected: the planner is advisory plus existing V1 verticals.
