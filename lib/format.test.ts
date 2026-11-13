import { describe, expect, test } from "bun:test";
import { credTypeLabel, formatDate, revokeReasonText, shortHash } from "./format";

describe("formatDate", () => {
  test("unix seconds give 5 Nov 2026", () => {
    expect(formatDate(1793844000)).toBe("5 Nov 2026");
  });

  test("uses Manila time, not the viewer's", () => {
    // 4 Nov 2026 17:30 UTC is already 5 Nov in Manila (UTC+8).
    expect(formatDate(new Date("2026-11-04T17:30:00Z"))).toBe("5 Nov 2026");
  });

  test("accepts ISO strings and Dates", () => {
    expect(formatDate("2026-11-11T02:00:00Z")).toBe("11 Nov 2026");
    expect(formatDate(new Date("2026-01-01T00:00:00+08:00"))).toBe("1 Jan 2026");
  });

  test("September has no stray full stop", () => {
    expect(formatDate("2026-09-15T02:00:00Z")).toBe("15 Sep 2026");
  });
});

describe("shortHash", () => {
  const h = "0x9f2c4be71d03a8f6c52e9b70d4e18a3c6f57b2d09e41a7c8a5b3c1d2e4f6a7c8";
  test("keeps 0x + 8 and the last 4", () => {
    expect(shortHash(h)).toBe("0x9f2c4be7…a7c8");
  });
  test("custom tail length", () => {
    expect(shortHash(h, 6)).toBe("0x9f2c4be7…f6a7c8");
  });
  test("short input is returned unchanged", () => {
    expect(shortHash("0x1234")).toBe("0x1234");
  });
});

describe("labels", () => {
  test("credential type", () => {
    expect(credTypeLabel("CERT_ENROLLMENT")).toBe("Certificate of Enrollment");
    expect(credTypeLabel("UNKNOWN")).toBe("Unknown type");
  });
  test("revoke reason mid-sentence", () => {
    expect(revokeReasonText("ISSUED_IN_ERROR")).toBe("issued in error");
    expect(revokeReasonText(null)).toBe("not given");
  });
});
