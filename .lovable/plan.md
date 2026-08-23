# Trips.bd — real verticals, Agoda-grade flows

Today every tile (`Hotels`, `Flights`, `Flight + Hotel`, `Activities`, `Homes & Apts`) links to the same `/search?q=&guests=2`, and the five service icons (`Attractions`, `Airport Transfer`, `Car Rentals`, `eSIM`, `Trains`) are `<button>`s with no handler. That gets replaced with one search architecture and eight real product verticals, each with its own inventory, search screen, results and booking flow.

## 1. Inventory (new tables, seeded)

New Supabase tables with public read policies, `authenticated` write where a booking is involved, plus literal seed rows in the migration:

- `airports` (IATA, city, country) and `flights` (airline, flight no, from/to airport, depart/arrive times, duration, stops, cabin, fare BDT, baggage) — domestic BD routes (DAC, CXB, ZYL, CGP, JSR, SPD, RJH) plus regional (BKK, KUL, DXB, CCU).
- `activities` (slug, destination, title, category, duration, from-price, rating, photos, highlights) and `activity_slots` (date, time, seats, price) — the "Attractions / Activities" vertical.
- `transfers` (airport, vehicle class, seats, luggage, price BDT) — Airport Transfer.
- `car_rentals` (model, class, transmission, seats, price/day, supplier, city).
- `esim_plans` (country, data GB, validity days, price BDT, network).
- `trains` (operator, route, class, depart/arrive, price BDT).
- `packages` (flight + hotel combos: route, listing, nights, bundle price, saving %).
- One generic `orders` table keyed by `vertical` + `item_id` + JSON `details`, mirroring the existing `bookings` pattern (reference code, status enum, RLS to owner, `order_events` timeline + realtime), so Trips shows every vertical in one feed.

Existing `listings`/`bookings` stay as-is for stays.

## 2. Search architecture

A single `SearchSheet` component (bottom sheet, Agoda-style) with per-vertical field sets:

```text
Stays:      Where -> Date range (2-month calendar) -> Rooms/Adults/Children
Flights:    One-way|Return -> From/To airport -> Dates -> Pax -> Cabin
Flight+Hotel: From/To -> Dates -> Pax -> Rooms
Activities: Where -> Date -> Pax
Transfer:   Airport -> Direction -> Date+Time -> Pax -> Luggage
Cars:       City -> Pick-up date+time -> Drop-off date+time
eSIM:       Destination country -> Days
Trains:     From/To station -> Date -> Class
```

Shared pieces: `DateRangeCalendar` (scrollable months, night count), `GuestStepper` (rooms/adults/children), `AirportPicker` (typeahead over `airports`). All state lives in URL search params via `validateSearch`, so results are shareable and SSR-rendered.

Results screens get the Agoda chip bar: `Sort`, `Filter`, `Price`, plus vertical-specific chips (stops/airline for flights, category for activities). No map — no map provider is wired.

## 3. Routes

```text
/stays            -> replaces current /search (redirect kept)
/flights          -> search sheet + fare list
/flights/book     -> passenger details -> booking request
/packages         -> flight + hotel bundles
/activities , /activities/$slug
/transfers , /cars , /esim , /trains
/order/$reference -> unified confirmation + realtime timeline
```

`/search` keeps working and redirects to `/stays` with params carried over, so existing links and the published URL don't break.

## 4. Flight flow (full depth)

Search sheet -> fare list (airline logo block, depart/arrive times, duration, stops, cabin, BDT fare, "cheapest / fastest" badges) -> fare detail with baggage + fare rules -> passenger details form (name, passport, DOB per pax, contact) -> creates an `orders` row with status `pending` -> `/order/$reference` confirmation with realtime status timeline. Request-to-book, same as hotels; no payment.

## 5. Home screen placement

Tiles and service icons stop being decorative: each links to its own vertical with sensible defaults (Hotels -> `/stays`, Flights -> `/flights`, Flight+Hotel -> `/packages`, Activities/Attractions -> `/activities`, Homes & Apts -> `/stays?kind=home`, Airport Transfer -> `/transfers`, Car Rentals -> `/cars`, eSIM -> `/esim`, Trains -> `/trains`). Trains loses its muted "coming soon" styling since it now has inventory.

## 6. Times and notifications

- All schedule data (flights, trains, transfers, activity slots) stores real timestamps and renders in Asia/Dhaka with duration and +1-day markers.
- Notification centre: `notifications` table written by triggers on order status change, a bell with unread dot in the home header, `/notifications` list, and realtime push into the UI. The existing onboarding notification opt-in screen finally sets a stored preference instead of being cosmetic.

## 7. Trips

`/trips` becomes multi-vertical: stays, flights, activities, transfers, cars, eSIM, trains grouped under Upcoming / Past, each with its status pill and realtime updates.

## Technical notes

Public catalogue reads go through the existing publishable-key server functions in `catalog.functions.ts` (new `flights.functions.ts`, `experiences.functions.ts`), so SSR and OG tags keep working on shareable result links. Order creation and user-scoped reads use `requireSupabaseAuth`. Realtime uses `useEffect` + `removeChannel`, matching `trips.tsx`. Tab transition animation, bottom nav and onboarding gate are untouched, and the nav keeps its five tabs — verticals are reached from Home, not the tab bar.

## Order of work

1. Migration: all tables, RLS, grants, triggers, seed rows.
2. Shared search primitives (sheet, calendar, steppers, pickers).
3. Stays migrated onto the new sheet, `/search` redirect.
4. Flights end-to-end (search -> fare -> pax -> order -> confirmation).
5. Activities, Packages.
6. Transfers, Cars, eSIM, Trains.
7. Notifications + Trips unification.
8. Typecheck and a headless browser pass over every vertical.

## Out of scope

Payments (all verticals stay request-to-book), live supplier APIs (Amadeus/Duffel etc. — inventory is seeded), and maps. Google/Apple providers still need enabling in your Supabase dashboard.
