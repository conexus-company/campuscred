import { describe, expect, test } from "bun:test";
import { replaceError } from "./reissue";

const ISSUER = "0x00000000000000000000000000000000000000aa";
const OTHER = "0x00000000000000000000000000000000000000bb";
const old = { student_id: "s1", issuer_wallet: ISSUER };
const ctx = { docHash: "0xnew", studentId: "s1", signer: ISSUER.toUpperCase(), isAdmin: false, replacedBy: null };

describe("replaceError", () => {
  test("the original issuer may replace it", () => expect(replaceError(old, ctx)).toBeNull());
  test("unknown old credential", () => expect(replaceError(null, ctx)).toBe("replace_not_found"));
  test("different student", () => expect(replaceError(old, { ...ctx, studentId: "s2" })).toBe("replace_wrong_student"));
  test("another issuer", () => expect(replaceError(old, { ...ctx, signer: OTHER })).toBe("forbidden"));
  test("admin may replace any issuer's", () => expect(replaceError(old, { ...ctx, signer: OTHER, isAdmin: true })).toBeNull());
  test("already replaced by another", () =>
    expect(replaceError(old, { ...ctx, replacedBy: "0xother" })).toBe("already_replaced"));
  test("a retry of the same replacement is fine", () => expect(replaceError(old, { ...ctx, replacedBy: "0xNEW" })).toBeNull());
});
