import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
let failAt = "";
const res = (step: string, extra: object = {}) =>
  step === failAt
    ? { error: { message: "boom" }, data: null, count: null }
    : { error: null, data: [], count: 1, ...extra };

function chain(step: string) {
  const r = res(step);
  const c: Record<string, unknown> = {};
  for (const m of ["select", "eq", "update", "delete"]) c[m] = (..._a: unknown[]) => c;
  c["then"] = (f: (v: unknown) => unknown) => {
    calls.push(step);
    return Promise.resolve(r).then(f);
  };
  return c;
}
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (t: string) => ({
      select: () => chain(`read ${t}`),
      insert: () =>
        chain(
          t === "retained_financial_records" ? "archive" : t === "deletion_audit" ? "audit" : t,
        ),
      delete: () => chain(t === "profiles" ? "delete profile" : `delete ${t}`),
      update: () => chain("complete request"),
    }),
    auth: {
      admin: {
        deleteUser: async () => {
          calls.push("auth");
          return res("delete auth user");
        },
      },
    },
  },
}));
import { fulfilAccountDeletion } from "@/lib/deletion.server";

beforeEach(() => {
  calls.length = 0;
  failAt = "";
  process.env["DELETION_PSEUDONYM_SALT"] = "s".repeat(40);
});

describe("fulfilAccountDeletion", () => {
  it("succeeds when every step succeeds", async () => {
    await expect(fulfilAccountDeletion("u", "e@x.bd", "r")).resolves.toMatchObject({ ok: true });
    expect(calls.at(-1)).toBe("complete request");
  });
  for (const step of [
    "read orders",
    "delete notifications",
    "delete profile",
    "delete auth user",
    "audit",
  ]) {
    it(`never reports ok when "${step}" fails`, async () => {
      failAt = step;
      await expect(fulfilAccountDeletion("u", "e@x.bd", "r")).rejects.toThrow(
        /account not deleted/,
      );
      expect(calls).not.toContain("complete request");
    });
  }
  it("refuses to run without a salt", async () => {
    delete process.env["DELETION_PSEUDONYM_SALT"];
    await expect(fulfilAccountDeletion("u", "e@x.bd")).rejects.toThrow(/temporarily unavailable/);
    expect(calls).toHaveLength(0);
  });
});
