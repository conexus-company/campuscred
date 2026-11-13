import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { MOCK_HASHES } from "@/lib/chain/mock";
import { isDocHash, sha256Hex } from "./hash";

const ABC = "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

describe("sha256Hex", () => {
  test('the bytes "abc" give the standard SHA-256 vector', async () => {
    expect(await sha256Hex(new Blob(["abc"]))).toBe(ABC);
  });

  test("changing one byte changes the hash", async () => {
    const a = await sha256Hex(new Blob([new Uint8Array([1, 2, 3, 4])]));
    const b = await sha256Hex(new Blob([new Uint8Array([1, 2, 3, 5])]));
    expect(a).not.toBe(b);
  });

  test("output is 0x plus 64 lowercase hex characters", async () => {
    for (const input of ["", "abc", "x".repeat(10_000)]) {
      expect(await sha256Hex(new Blob([input]))).toMatch(/^0x[0-9a-f]{64}$/);
    }
  });

  test("the sample PDFs hash to the mock fixtures", async () => {
    const valid = new Blob([readFileSync("public/samples/sample-valid.pdf")]);
    const revoked = new Blob([readFileSync("public/samples/sample-revoked.pdf")]);
    expect(await sha256Hex(valid)).toBe(MOCK_HASHES.active);
    expect(await sha256Hex(revoked)).toBe(MOCK_HASHES.revoked);
  });
});

describe("isDocHash", () => {
  test("accepts 0x plus 64 hex", () => {
    expect(isDocHash(ABC)).toBe(true);
    expect(isDocHash(ABC.toUpperCase().replace("0X", "0x"))).toBe(true);
  });
  test("rejects anything else", () => {
    expect(isDocHash(ABC.slice(0, -1))).toBe(false);
    expect(isDocHash(ABC.slice(2))).toBe(false);
    expect(isDocHash(`${ABC.slice(0, -1)}g`)).toBe(false);
  });
});
