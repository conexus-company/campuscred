import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { encodeCredType, encodeReason } from "@/lib/contract/codes";
import type { Hex } from "@/lib/types/credential";
import { MOCK_HASHES, MOCK_ISSUER } from "./mock";
import { decodeRecord, readChainRecord, type RawCredential } from "./read";

const ZERO32 = `0x${"0".repeat(64)}`;

describe("readChainRecord with NEXT_PUBLIC_USE_MOCK_CHAIN=true", () => {
  let before: string | undefined;
  beforeEach(() => {
    before = process.env.NEXT_PUBLIC_USE_MOCK_CHAIN;
    process.env.NEXT_PUBLIC_USE_MOCK_CHAIN = "true";
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_CHAIN = before;
  });

  test("active fixture", async () => {
    const r = await readChainRecord(MOCK_HASHES.active);
    expect(r.status).toBe("active");
    expect(r.credType).toBe("CERT_ENROLLMENT");
    expect(r.issuer).toBe(MOCK_ISSUER);
    expect(r.issuedAt).toBe(1793844000);
    expect(r.revokeReason).toBeNull();
  });

  test("revoked fixture", async () => {
    const r = await readChainRecord(MOCK_HASHES.revoked);
    expect(r.status).toBe("revoked");
    expect(r.revokedAt).toBe(1794362400);
    expect(r.revokeReason).toBe("ISSUED_IN_ERROR");
  });

  test("unknown fixture", async () => {
    const r = await readChainRecord(MOCK_HASHES.unknown);
    expect(r.status).toBe("none");
    expect(r.credType).toBe("UNKNOWN");
    expect(r.issuedAt).toBeNull();
  });

  test("lookup ignores hash case and keeps the caller's docHash", async () => {
    const upper = MOCK_HASHES.active.toUpperCase().replace("0X", "0x") as Hex;
    const r = await readChainRecord(upper);
    expect(r.status).toBe("active");
    expect(r.docHash).toBe(upper);
  });
});

describe("decodeRecord", () => {
  const base: RawCredential = {
    studentRef: `0x${"ab".repeat(32)}`,
    credType: encodeCredType("DIPLOMA"),
    issuer: "0x4a1b7e2c9d03f58a6b21c4e07d9f3a85b6e2c9e2",
    issuedAt: BigInt(1793844000),
    revokedAt: BigInt(0),
    status: BigInt(1),
    revokeReason: ZERO32,
  };

  test("active struct", () => {
    const r = decodeRecord(MOCK_HASHES.active, base);
    expect(r.status).toBe("active");
    expect(r.credType).toBe("DIPLOMA");
    expect(r.issuedAt).toBe(1793844000);
    expect(r.revokedAt).toBeNull();
    expect(r.revokeReason).toBeNull();
  });

  test("revoked struct decodes time and reason", () => {
    const r = decodeRecord(MOCK_HASHES.revoked, {
      ...base,
      status: BigInt(2),
      revokedAt: BigInt(1794362400),
      revokeReason: encodeReason("FRAUD"),
    });
    expect(r.status).toBe("revoked");
    expect(r.revokedAt).toBe(1794362400);
    expect(r.revokeReason).toBe("FRAUD");
  });

  test("status None means not found, whatever else is set", () => {
    const r = decodeRecord(MOCK_HASHES.unknown, { ...base, status: BigInt(0) });
    expect(r.status).toBe("none");
    expect(r.credType).toBe("UNKNOWN");
    expect(r.issuedAt).toBeNull();
  });

  test("unknown credType hash decodes to UNKNOWN", () => {
    expect(decodeRecord(MOCK_HASHES.active, { ...base, credType: `0x${"cd".repeat(32)}` }).credType).toBe("UNKNOWN");
  });

  test("an out-of-range status is treated as none", () => {
    expect(decodeRecord(MOCK_HASHES.active, { ...base, status: 9 }).status).toBe("none");
  });
});
