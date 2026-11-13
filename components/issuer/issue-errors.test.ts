import { describe, expect, test } from "bun:test";
import { FALLBACK_MESSAGE } from "@/lib/chain/write";
import { apiErrorMessage } from "./issue-errors";

describe("apiErrorMessage", () => {
  test("maps known codes", () => {
    expect(apiErrorMessage("unknown_student")).toBe("That student is not in the records.");
    expect(apiErrorMessage("forbidden")).toBe("This wallet is not an issuer.");
  });

  test("falls back for unknown or missing codes", () => {
    expect(apiErrorMessage("unavailable")).toBe(FALLBACK_MESSAGE);
    expect(apiErrorMessage(undefined)).toBe(FALLBACK_MESSAGE);
    expect(apiErrorMessage("toString")).toBe(FALLBACK_MESSAGE);
  });
});
