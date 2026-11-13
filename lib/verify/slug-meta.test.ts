import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { MOCK_HASHES, MOCK_ISSUER } from "@/lib/chain/mock";
import { MOCK_SLUGS } from "./mock-slugs";
import { type CredentialRow, getSlugMeta, isValidSlug, toSlugMeta } from "./slug-meta";

const ROW: CredentialRow = {
  doc_hash: MOCK_HASHES.active,
  cred_type: "CERT_ENROLLMENT",
  title: "Certificate of Enrollment",
  issuer_wallet: MOCK_ISSUER,
  issued_at: "2026-11-05T02:00:00+00:00",
  issue_tx: `0x${"ab".repeat(32)}`,
  is_public: true,
  issuers: { display_name: "BatStateU Registrar" },
};

const SAFE_KEYS = ["credType", "docHash", "issuedAt", "issuerName", "issuerWallet", "title", "txUrl"];

describe("toSlugMeta", () => {
  test("maps a public row to the safe fields only", () => {
    const meta = toSlugMeta(ROW);
    expect(meta).not.toBeNull();
    expect(Object.keys(meta!).sort()).toEqual(SAFE_KEYS);
    expect(meta!.issuerName).toBe("BatStateU Registrar");
    expect(meta!.issuedAt).toBe(1793844000);
    expect(meta!.txUrl).toBe(`https://testnet.bscscan.com/tx/0x${"ab".repeat(32)}`);
  });

  test("a private row is null, like an unknown slug", () => {
    expect(toSlugMeta({ ...ROW, is_public: false })).toBeNull();
    expect(toSlugMeta(null)).toBeNull();
  });

  test("accepts the join as an array and falls back to the wallet", () => {
    expect(toSlugMeta({ ...ROW, issuers: [{ display_name: "Registrar" }] })!.issuerName).toBe("Registrar");
    expect(toSlugMeta({ ...ROW, issuers: null })!.issuerName).toBe(MOCK_ISSUER);
  });
});

describe("isValidSlug", () => {
  test("accepts share slugs and rejects anything else", () => {
    expect(isValidSlug("k7Qm2xVa9P")).toBe(true);
    expect(isValidSlug("../etc")).toBe(false);
    expect(isValidSlug("a b")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("getSlugMeta with NEXT_PUBLIC_USE_MOCK_CHAIN=true", () => {
  let before: string | undefined;
  beforeEach(() => {
    before = process.env.NEXT_PUBLIC_USE_MOCK_CHAIN;
    process.env.NEXT_PUBLIC_USE_MOCK_CHAIN = "true";
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_CHAIN = before;
  });

  test("valid and revoked slugs resolve to the mock chain hashes", async () => {
    expect((await getSlugMeta(MOCK_SLUGS.valid))?.docHash).toBe(MOCK_HASHES.active);
    expect((await getSlugMeta(MOCK_SLUGS.revoked))?.docHash).toBe(MOCK_HASHES.revoked);
  });

  test("returns only the safe fields", async () => {
    expect(Object.keys((await getSlugMeta(MOCK_SLUGS.valid))!).sort()).toEqual(SAFE_KEYS);
  });

  test("private, unknown and malformed slugs are null", async () => {
    expect(await getSlugMeta(MOCK_SLUGS.private)).toBeNull();
    expect(await getSlugMeta("zzzzzzzzzz")).toBeNull();
    expect(await getSlugMeta("../x")).toBeNull();
  });
});
