import { describe, expect, it } from "vitest";

import { priceBdt, USD_TO_BDT } from "@/lib/esim.server";

describe("eSIM pricing", () => {
  it("converts provider retail units (1/10000 USD) to BDT, rounded up to 10", () => {
    expect(USD_TO_BDT).toBe(125);
    // 36000 units = USD 3.60 → 450 BDT
    expect(priceBdt(36000)).toBe(450);
    // USD 1.81 → 226.25 → 230
    expect(priceBdt(18100)).toBe(230);
  });
});
