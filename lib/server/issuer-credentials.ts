// Issuer dashboard data (alvin/06-issuer-dashboard). Server only: rows include student names.
import { txUrl, type Hex } from "@/lib/contract/config";
import type { CredType, RevokeReason } from "@/lib/contract/codes";
import { hasRole } from "./chain";
import { WalletAuthError, verifyWalletAuth } from "./wallet-auth";

/** Signed caller holding the issuer or admin role. Admins see every issuer's credentials. */
export async function issuerScope(headers: Headers, check: typeof hasRole = hasRole) {
  const address = verifyWalletAuth(headers);
  const [isIssuer, isAdmin] = await Promise.all([check("issuer", address), check("admin", address)]);
  if (!isIssuer && !isAdmin) throw new WalletAuthError("forbidden", 403);
  return { address, isAdmin };
}

export const CREDENTIAL_COLUMNS =
  "doc_hash, cred_type, title, issuer_wallet, issued_at, issue_tx, share_slug, is_public, status, revoke_tx, revoke_reason, revoked_at, students(full_name, student_no), issuers(display_name)";

type One<T> = T | T[] | null;
export type IssuerCredentialRow = {
  doc_hash: string;
  cred_type: string;
  title: string;
  issuer_wallet: string;
  issued_at: string;
  issue_tx: string;
  share_slug: string;
  is_public: boolean;
  status: "active" | "revoked";
  revoke_tx: string | null;
  revoke_reason: string | null;
  revoked_at: string | null;
  students: One<{ full_name: string; student_no: string }>;
  issuers: One<{ display_name: string }>;
};

const one = <T>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
const unix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

export function toIssuerCredential(row: IssuerCredentialRow) {
  const student = one(row.students);
  const issuer = one(row.issuers);
  const issuerWallet = row.issuer_wallet.trim() as Hex;
  const issueTx = row.issue_tx.trim() as Hex;
  return {
    docHash: row.doc_hash.trim() as Hex,
    credType: row.cred_type as CredType, // the column's check constraint allows only the seven codes
    title: row.title,
    studentName: student?.full_name ?? null,
    studentNo: student?.student_no ?? null,
    issuerWallet,
    issuerName: issuer?.display_name ?? issuerWallet,
    issuedAt: unix(row.issued_at),
    status: row.status,
    issueTx,
    txUrl: txUrl(issueTx),
    slug: row.share_slug,
    isPublic: row.is_public,
    revokeTx: (row.revoke_tx?.trim() ?? null) as Hex | null,
    revokeReason: row.revoke_reason as RevokeReason | null,
    revokedAt: row.revoked_at ? unix(row.revoked_at) : null,
  };
}

export type IssuerCredential = ReturnType<typeof toIssuerCredential>;
