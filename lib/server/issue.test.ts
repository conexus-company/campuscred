import { describe, expect, test } from "bun:test";
import { MAX_PDF_BYTES, checkPdf, newSlug, searchTerm, sha256Bytes } from "./issue";

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
