import { describe, expect, test } from "bun:test";
import { validateClaim } from "./claim-rules";

const ok = { studentNo: "22-00001", email: "Student1@Example.com ", password: "correct-horse", confirm: "correct-horse" };

describe("validateClaim", () => {
  test("accepts a well-formed claim and normalises the email", () => {
    expect(validateClaim(ok)).toEqual({ studentNo: "22-00001", email: "student1@example.com", error: null });
  });

  test("rejects missing fields", () => {
    expect(validateClaim({ ...ok, studentNo: " " }).error).toContain("every field");
  });

  test("rejects a malformed student number before any query", () => {
    expect(validateClaim({ ...ok, studentNo: "22-1' or 1=1" }).error).toContain("22-00001");
  });

  test("rejects a short password", () => {
    expect(validateClaim({ ...ok, password: "short", confirm: "short" }).error).toContain("8 characters");
  });

  test("rejects mismatched passwords", () => {
    expect(validateClaim({ ...ok, confirm: "different-one" }).error).toContain("don’t match");
  });
});
