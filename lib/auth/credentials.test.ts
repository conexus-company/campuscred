import { describe, expect, test } from "bun:test";
import { isDocHash, pdfFileName, toMyCredential, type MyCredentialRow } from "./credentials";

const HASH = `0x${"ab".repeat(32)}`;
const row: MyCredentialRow = {
  doc_hash: HASH,
  share_slug: "Ab3dE6gH9k",
  cred_type: "DIPLOMA",
  title: "Bachelor of Science in Computer Science",
  issuer_wallet: "0xf00c9e7f65bA3ea9B48b1093f817cEeE40EFd459",
  issued_at: "2026-11-05T02:00:00+00:00",
  status: "active",
  issue_tx: `0x${"11".repeat(32)}`,
  revoke_tx: null,
  revoke_reason: null,
  is_public: true,
  issuers: { display_name: "Office of the Registrar (sample)" },
};

describe("toMyCredential", () => {
  test("maps an active row to the API shape", () => {
    const c = toMyCredential(row);
    expect(c).toEqual({
      docHash: HASH as `0x${string}`,
      slug: "Ab3dE6gH9k",
      credType: "DIPLOMA",
      title: row.title,
      issuerName: "Office of the Registrar (sample)",
      issuedAt: Math.floor(Date.parse(row.issued_at) / 1000),
      status: "active",
      issueTx: row.issue_tx as `0x${string}`,
      isPublic: true,
    });
  });

  test("never exposes the PDF path or student fields", () => {
    const keys = Object.keys(toMyCredential({ ...row, pdf_path: "x/y.pdf", student_id: "u" } as MyCredentialRow));
    for (const k of keys) expect(["pdf_path", "pdfPath", "student_id", "studentId"]).not.toContain(k);
  });

  test("revoked rows carry the revoke tx and a known reason", () => {
    const c = toMyCredential({ ...row, status: "revoked", revoke_tx: `0x${"22".repeat(32)}`, revoke_reason: "WRONG_DETAILS" });
    expect(c.status).toBe("revoked");
    expect(c.revokeTx).toBe(`0x${"22".repeat(32)}`);
    expect(c.revokeReason).toBe("WRONG_DETAILS");
  });

  test("unknown reasons are dropped, issuer falls back to the wallet", () => {
    const c = toMyCredential({ ...row, status: "revoked", revoke_reason: "nope", issuers: null });
    expect(c.revokeReason).toBeUndefined();
    expect(c.issuerName).toBe(row.issuer_wallet);
  });

  test("trims char(n) padding", () => {
    expect(toMyCredential({ ...row, doc_hash: `${HASH}  ` }).docHash).toBe(HASH as `0x${string}`);
  });
});

describe("isDocHash", () => {
  test("accepts 0x + 64 hex only", () => {
    expect(isDocHash(HASH)).toBe(true);
    expect(isDocHash(HASH.slice(0, 20))).toBe(false);
    expect(isDocHash("../../etc/passwd")).toBe(false);
  });
});

describe("pdfFileName", () => {
  test("keeps letters and spaces, strips path characters", () => {
    expect(pdfFileName("Certificate of Enrollment")).toBe("Certificate of Enrollment.pdf");
    expect(pdfFileName('a/b\\c"d')).toBe("abcd.pdf");
    expect(pdfFileName("///")).toBe("credential.pdf");
  });
});
