import { describe, expect, test } from "bun:test";
import { slugFromScan } from "./qr-link";

describe("slugFromScan", () => {
  test("reads the slug from a share link, with or without ?via=qr", () => {
    expect(slugFromScan("https://campuscred.example/v/k7Qm2xVa9P")).toBe("k7Qm2xVa9P");
    expect(slugFromScan("http://localhost:3000/v/k7Qm2xVa9P?via=qr")).toBe("k7Qm2xVa9P");
    expect(slugFromScan(" https://x.test/v/k7Qm2xVa9P/ ")).toBe("k7Qm2xVa9P");
  });

  test("rejects anything that is not a /v/<slug> web link", () => {
    expect(slugFromScan("k7Qm2xVa9P")).toBeNull();
    expect(slugFromScan("https://x.test/verify")).toBeNull();
    expect(slugFromScan("https://x.test/v/a/b")).toBeNull();
    expect(slugFromScan("javascript:alert(1)//v/abcd")).toBeNull();
    expect(slugFromScan("https://x.test/v/%2e%2e%2fadmin")).toBeNull();
    expect(slugFromScan("WIFI:S:cafe;P:secret;;")).toBeNull();
  });
});
