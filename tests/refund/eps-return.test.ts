import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// Static guard: the EPS return handler must fail closed on missing amount / tx mismatch.
const src = readFileSync("src/routes/api/public/eps/return.ts", "utf8");
describe("EPS return verification", () => {
  it("does not accept a null verified amount", () => {
    expect(src).toContain("v.amount !== null &&");
    expect(src).not.toContain("v.amount === null ||");
  });
  it("requires matching merchant transaction id", () => {
    expect(src).toMatch(/amountOk && txOk/);
  });
});
