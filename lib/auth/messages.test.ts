import { describe, expect, test } from "bun:test";
import { signInMessage } from "./messages";

describe("signInMessage", () => {
  test("wrong password says what to do", () => {
    expect(signInMessage("invalid_credentials")).toContain("try again");
  });

  test("unknown codes fall back to a generic message", () => {
    expect(signInMessage("something_new")).toBe(signInMessage("unknown"));
  });

  test("never leaks the raw code", () => {
    for (const code of ["invalid_credentials", "email_not_confirmed", "user_banned", "x_y"]) {
      expect(signInMessage(code)).not.toContain(code);
    }
  });
});
