import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "docs/play-listing.md",
  "docs/play-store.md",
  "docs/product-truth.md",
  "src/routes/privacy.tsx",
  "src/routes/terms.tsx",
];
const skip = /forbidden|compliance check|blocked by|\bno live|not a live|must not|", "/i;
const banned = [
  /no payment is taken/i,
  /do not take payments in the app/i,
  /never hold payment/i,
  /instant book/i,
  /book instantly/i,
  /live fares/i,
  /real-time availability/i,
  /payment link/i,
];

describe("disclosures agree with EPS checkout", () => {
  for (const f of files)
    it(`${f} has no contradicting claims`, () => {
      const t = readFileSync(f, "utf8")
        .split("\n")
        .filter((l) => !skip.test(l))
        .join("\n");
      for (const b of banned) expect(t, `${f} matches ${b}`).not.toMatch(b);
    });
});
