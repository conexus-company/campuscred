import { describe, expect, test } from "bun:test";
import { Interface, ZeroAddress, ZeroHash } from "ethers";
import { CAMPUSCRED_ABI } from "@/lib/contract/CampusCred.abi";
import { CANCELLED_MESSAGE, FALLBACK_MESSAGE, mapContractError } from "./write";

const iface = new Interface(CAMPUSCRED_ABI);
const HASH = `0x${"ab".repeat(32)}`;

const cases: [name: string, args: unknown[], message: string][] = [
  ["AlreadyIssued", [HASH], "This document was already issued."],
  ["NotAllowed", [], "This wallet is not allowed to do that."],
  ["AccessControlUnauthorizedAccount", [ZeroAddress, ZeroHash], "This wallet is not allowed to do that."],
  ["EmptyHash", [], "Choose a PDF first."],
  ["EnforcedPause", [], "Issuing is paused by the admin."],
  ["AlreadyRevoked", [HASH], "This credential is already revoked."],
  ["NotFound", [HASH], "This credential is not on chain."],
];

describe("mapContractError", () => {
  for (const [name, args, message] of cases) {
    test(`${name} via decoded revert`, () => {
      expect(mapContractError({ code: "CALL_EXCEPTION", revert: { name } })).toBe(message);
    });
    test(`${name} via raw revert data`, () => {
      const data = iface.encodeErrorResult(name, args);
      expect(mapContractError({ data })).toBe(message);
      expect(mapContractError({ info: { error: { data } } })).toBe(message);
    });
  }

  test("rejected signature", () => {
    expect(mapContractError({ code: "ACTION_REJECTED" })).toBe(CANCELLED_MESSAGE);
    expect(mapContractError({ code: 4001 })).toBe(CANCELLED_MESSAGE);
    expect(mapContractError({ info: { error: { code: 4001 } } })).toBe(CANCELLED_MESSAGE);
  });

  test("unknown errors fall back", () => {
    expect(mapContractError(new Error("boom"))).toBe(FALLBACK_MESSAGE);
    expect(mapContractError({ data: "0xdeadbeef" })).toBe(FALLBACK_MESSAGE);
    expect(mapContractError(null)).toBe(FALLBACK_MESSAGE);
  });
});
