import { describe, expect, test } from "bun:test";
import { WalletAuthError } from "./wallet-auth";
import { issuerScope, toIssuerCredential, type IssuerCredentialRow } from "./issuer-credentials";

const hash = `0x${"ab".repeat(32)}`;
const tx = `0x${"cd".repeat(32)}`;
const wallet = "0x4a1B000000000000000000000000000000C9e2";

const row: IssuerCredentialRow = {
  doc_hash: hash,
  cred_type: "CERT_GRADES",
  title: "1st Sem AY 2026–2027",
  issuer_wallet: `${wallet}`,
  issued_at: "2026-11-05T02:00:00+00:00",
  issue_tx: tx,
  share_slug: "abcDEF1234",
  is_public: true,
  status: "revoked",
  revoke_tx: tx,
  revoke_reason: "FRAUD",
  revoked_at: "2026-11-06T02:00:00+00:00",
  students: [{ full_name: "Juan Dela Cruz", student_no: "22-12345" }],
  issuers: { display_name: "Office of the Registrar (sample)" },
};

describe("toIssuerCredential", () => {
  test("maps joins given as an array or an object", () => {
    const c = toIssuerCredential(row);
    expect(c.studentName).toBe("Juan Dela Cruz");
    expect(c.studentNo).toBe("22-12345");
    expect(c.issuerName).toBe("Office of the Registrar (sample)");
    expect(c.issuedAt).toBe(Date.parse("2026-11-05T02:00:00Z") / 1000);
    expect(c.revokedAt).toBe(Date.parse("2026-11-06T02:00:00Z") / 1000);
    expect(c.txUrl).toBe(`https://testnet.bscscan.com/tx/${tx}`);
  });

  test("handles a missing student, issuer and revoke fields", () => {
    const c = toIssuerCredential({
      ...row,
      status: "active",
      revoke_tx: null,
      revoke_reason: null,
      revoked_at: null,
      students: null,
      issuers: [],
    });
    expect(c.studentName).toBeNull();
    expect(c.issuerName).toBe(wallet);
    expect(c.revokeTx).toBeNull();
    expect(c.revokedAt).toBeNull();
  });
});

describe("issuerScope", () => {
  // No signed headers at all: rejected before any role read.
  test("rejects unsigned requests", async () => {
    await expect(issuerScope(new Headers(), async () => true)).rejects.toBeInstanceOf(WalletAuthError);
  });
});
