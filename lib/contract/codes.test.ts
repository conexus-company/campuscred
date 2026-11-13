import { describe, expect, test } from "bun:test";
import { ZeroHash, encodeBytes32String, keccak256, toUtf8Bytes } from "ethers";
import { CAMPUSCRED_ABI } from "./CampusCred.abi";
import {
  CRED_TYPES,
  REVOKE_REASONS,
  decodeCredType,
  decodeReason,
  encodeCredType,
  encodeReason,
} from "./codes";

describe("cred types", () => {
  test.each([...CRED_TYPES])("%s round-trips", (code) => {
    expect(decodeCredType(encodeCredType(code))).toBe(code);
  });

  test("decode is case-insensitive on the hex", () => {
    expect(decodeCredType(encodeCredType("DIPLOMA").toUpperCase().replace("0X", "0x"))).toBe("DIPLOMA");
  });

  test("DIPLOMA hash matches keccak256(toUtf8Bytes)", () => {
    expect(encodeCredType("DIPLOMA")).toBe(keccak256(toUtf8Bytes("DIPLOMA")) as `0x${string}`);
  });

  test("unknown bytes32 decodes to UNKNOWN", () => {
    expect(decodeCredType(keccak256(toUtf8Bytes("NOT_A_TYPE")))).toBe("UNKNOWN");
    expect(decodeCredType(ZeroHash)).toBe("UNKNOWN");
  });
});

describe("revoke reasons", () => {
  test.each([...REVOKE_REASONS])("%s round-trips", (code) => {
    expect(decodeReason(encodeReason(code))).toBe(code);
  });

  test("zero bytes32 decodes to null", () => {
    expect(decodeReason(ZeroHash)).toBeNull();
  });

  test("unknown short string decodes to null", () => {
    expect(decodeReason(encodeBytes32String("NOPE"))).toBeNull();
  });

  test("invalid bytes32 string decodes to null without throwing", () => {
    expect(decodeReason(keccak256(toUtf8Bytes("x")))).toBeNull();
    expect(decodeReason("0x1234")).toBeNull();
  });
});

test("ABI has no transfer* or approve* function", () => {
  const bad = CAMPUSCRED_ABI.filter(
    (e) => e.type === "function" && /^(transfer|approve)/i.test(e.name),
  );
  expect(bad).toEqual([]);
});
