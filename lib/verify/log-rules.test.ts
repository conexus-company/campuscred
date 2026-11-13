import { describe, expect, test } from "bun:test";
import { parseLogEntry } from "./log-rules";

const HASH = `0x${"AB".repeat(32)}`;

describe("parseLogEntry", () => {
  test("keeps only docHash, result and method, with the hash lower-cased", () => {
    const e = parseLogEntry({ docHash: HASH, result: "valid", method: "qr", ip: "1.2.3.4", name: "Juan" });
    expect(e).toEqual({ docHash: HASH.toLowerCase() as `0x${string}`, result: "valid", method: "qr" });
  });

  test("rejects unknown results and methods", () => {
    expect(parseLogEntry({ docHash: HASH, result: "maybe", method: "qr" })).toBeNull();
    expect(parseLogEntry({ docHash: HASH, result: "valid", method: "email" })).toBeNull();
  });

  test("rejects malformed hashes and non-objects", () => {
    expect(parseLogEntry({ docHash: "0x123", result: "valid", method: "qr" })).toBeNull();
    expect(parseLogEntry(null)).toBeNull();
    expect(parseLogEntry("valid")).toBeNull();
  });
});
