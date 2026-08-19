/** Tally form IDs (created in the Trips.bd Tally workspace). */
export const TALLY_FORMS = {
  host: "44lkj5",
  support: "ob8Bob",
} as const;

export type TallyFormKey = keyof typeof TALLY_FORMS;

export function tallyUrl(key: TallyFormKey, params?: Record<string, string | undefined>) {
  const search = new URLSearchParams({ transparentBackground: "1", hideTitle: "1" });
  for (const [k, v] of Object.entries(params ?? {})) if (v) search.set(k, v);
  return `https://tally.so/embed/${TALLY_FORMS[key]}?${search.toString()}`;
}
