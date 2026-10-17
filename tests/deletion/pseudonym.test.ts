import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/integrations/supabase/client.server", () => ({ supabaseAdmin: {} }));
import { DeletionConfigError, deletionSalt, pseudonym } from "../../src/lib/deletion.server";

const OLD = process.env["DELETION_PSEUDONYM_SALT"];
afterEach(() => {
  if (OLD === undefined) delete process.env["DELETION_PSEUDONYM_SALT"];
  else process.env["DELETION_PSEUDONYM_SALT"] = OLD;
});

describe("deletion pseudonymisation", () => {
  it("fails closed when the salt is missing", () => {
    delete process.env["DELETION_PSEUDONYM_SALT"];
    expect(() => deletionSalt()).toThrow(DeletionConfigError);
  });
  it("fails closed when the salt is short", () => {
    process.env["DELETION_PSEUDONYM_SALT"] = "short";
    expect(() => deletionSalt()).toThrow(DeletionConfigError);
  });
  it("error message never contains the salt", () => {
    process.env["DELETION_PSEUDONYM_SALT"] = "x";
    try {
      deletionSalt();
    } catch (e) {
      expect(String(e)).not.toContain("x:");
    }
  });
  it("is deterministic and salt-dependent", async () => {
    const a = "a".repeat(32),
      b = "b".repeat(32);
    expect(await pseudonym("u1", a)).toBe(await pseudonym("u1", a));
    expect(await pseudonym("u1", a)).not.toBe(await pseudonym("u1", b));
    expect(await pseudonym("u1", a)).toMatch(/^[0-9a-f]{32}$/);
  });
});
