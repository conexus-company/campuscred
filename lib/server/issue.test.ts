import { describe, expect, test } from "bun:test";
import { encodeReason } from "@/lib/contract/codes";
import { MAX_PDF_BYTES, checkPdf, newSlug, revokeEventError, revokedFields, searchTerm, sha256Bytes } from "./issue";

const pdf = new TextEncoder().encode("%PDF-1.7\n...");

describe("checkPdf", () => {
  test("accepts a %PDF header", () => expect(checkPdf(pdf)).toBeNull());
  test("rejects other bytes", () => expect(checkPdf(new TextEncoder().encode("hello"))).toBe("not_pdf"));
  test("rejects an empty file", () => expect(checkPdf(new Uint8Array())).toBe("not_pdf"));
  test("rejects over 10 MB", () => {
    const big = new Uint8Array(MAX_PDF_BYTES + 1);
    big.set(pdf);
    expect(checkPdf(big)).toBe("too_large");
  });
});

describe("sha256Bytes", () => {
  test("matches the known digest of 'abc'", () => {
    expect(sha256Bytes(new TextEncoder().encode("abc"))).toBe(
      "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("newSlug", () => {
  test("is 10 URL-safe characters and random", () => {
    const a = newSlug();
    expect(a).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(newSlug()).not.toBe(a);
  });
});

describe("searchTerm", () => {
  test("keeps names and student numbers", () => {
    expect(searchTerm(" Juan Dela Cruz ")).toBe("Juan Dela Cruz");
    expect(searchTerm("22-12345")).toBe("22-12345");
    expect(searchTerm("O'Neil")).toBe("O'Neil");
  });
  test("strips filter syntax", () => expect(searchTerm("a,id.eq.1)%*")).toBe("aid.eq.1"));
  test("null when too short or missing", () => {
    expect(searchTerm("a")).toBeNull();
    expect(searchTerm(null)).toBeNull();
    expect(searchTerm(",,")).toBeNull();
  });
});

describe("revoke event", () => {
  const hash = `0x${"ab".repeat(32)}`;
  const tx = `0x${"CD".repeat(32)}`;
  const by = "0x4a1B000000000000000000000000000000c9E2";
  const event = { docHash: hash, reason: encodeReason("FRAUD"), by, timestamp: 1_790_000_000 };

  test("accepts a matching event, any case", () =>
    expect(revokeEventError(event, hash.toUpperCase().replace("0X", "0x"), by.toLowerCase())).toBeNull());
  test("rejects another credential's event", () =>
    expect(revokeEventError(event, `0x${"ef".repeat(32)}`, by)).toBe("mismatch"));
  test("rejects an event revoked by another wallet", () =>
    expect(revokeEventError(event, hash, "0x0000000000000000000000000000000000000001")).toBe("forbidden"));
  test("builds the columns from the event", () =>
    expect(revokedFields(event, tx)).toEqual({
      status: "revoked",
      revoke_tx: tx.toLowerCase(),
      revoke_reason: "FRAUD",
      revoked_at: new Date(1_790_000_000_000).toISOString(),
    }));
});
