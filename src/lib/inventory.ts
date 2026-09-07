/**
 * Inventory gate.
 *
 * Every catalogue row currently in the database comes from seed statements in
 * `supabase/migrations/`; none of it is contracted, available inventory. Presenting it
 * as bookable would be a false claim to travellers and to Play review, so all catalogue
 * reads return empty until real supplier rows are loaded and this flag is switched on.
 *
 * Requests still work: each vertical shows a "tell us what you need" state that creates a
 * real row in `public.orders`, which our team sources manually.
 */
export const INVENTORY_LIVE = process.env["INVENTORY_LIVE"] === "true";

/** Client-side twin of the gate (empty states, copy). */
export const inventoryLiveClient = import.meta.env["VITE_INVENTORY_LIVE"] === "true";
