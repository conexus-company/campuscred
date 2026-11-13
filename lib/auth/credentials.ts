// Server only: the signed-in student's own credentials. Never import from a client component.
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REVOKE_REASONS } from "@/lib/contract/codes";
import type { CredType, Hex, MyCredential, RevokeReason } from "@/lib/types/credential";

export type { MyCredential };


/** Signed download links expire after 60 seconds (pr-gil.md 3.8). */
export const DOWNLOAD_TTL_SECONDS = 60;

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export function isDocHash(value: string): value is Hex {
  return HASH_RE.test(value);
}

/** One row of `credentials` joined with `issuers`, as selected below. */
export type MyCredentialRow = {
  doc_hash: string;
  share_slug: string;
  cred_type: string;
  title: string;
  issuer_wallet: string;
  issued_at: string;
  status: string;
  issue_tx: string;
  revoke_tx: string | null;
  revoke_reason: string | null;
  is_public: boolean;
  issuers: { display_name: string } | { display_name: string }[] | null;
};

const COLUMNS =
  "doc_hash, share_slug, cred_type, title, issuer_wallet, issued_at, status, issue_tx, revoke_tx, revoke_reason, is_public, issuers(display_name)";

function asReason(value: string | null): RevokeReason | undefined {
  const v = value?.trim();
  return v && (REVOKE_REASONS as readonly string[]).includes(v) ? (v as RevokeReason) : undefined;
}

/** Pure mapping from a database row. char(n) columns are trimmed. */
export function toMyCredential(row: MyCredentialRow): MyCredential {
  const issuer = Array.isArray(row.issuers) ? row.issuers[0] : row.issuers;
  const revoked = row.status === "revoked";
  return {
    docHash: row.doc_hash.trim() as Hex,
    slug: row.share_slug,
    credType: row.cred_type as CredType,
    title: row.title,
    issuerName: issuer?.display_name ?? row.issuer_wallet.trim(),
    issuedAt: Math.floor(new Date(row.issued_at).getTime() / 1000),
    status: revoked ? "revoked" : "active",
    issueTx: row.issue_tx.trim() as Hex,
    ...(revoked && row.revoke_tx ? { revokeTx: row.revoke_tx.trim() as Hex } : {}),
    ...(revoked && asReason(row.revoke_reason) ? { revokeReason: asReason(row.revoke_reason) } : {}),
    isPublic: row.is_public,
  };
}

/**
 * The signed-in student's credentials, newest first, or null when nobody is signed in.
 * Uses the session client, so RLS ("students read own credentials") limits the rows.
 */
export async function listMyCredentials(): Promise<MyCredential[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("credentials")
    .select(COLUMNS)
    .eq("student_id", user.id)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as MyCredentialRow[]).map(toMyCredential);
}

export type DownloadUrlResult =
  | { ok: true; url: string; expiresAt: number }
  | { ok: false; error: "unauthorized" | "not_found" };

/**
 * A 60-second signed URL for the student's own PDF. Ownership is checked twice: the
 * session client only sees the student's rows (RLS), and the row's student_id must match.
 * Only then does the service role sign the private bucket path.
 */
export async function createDownloadUrl(docHash: string): Promise<DownloadUrlResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!isDocHash(docHash)) return { ok: false, error: "not_found" };

  const { data, error } = await supabase
    .from("credentials")
    .select("student_id, pdf_path, title")
    .eq("doc_hash", docHash.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!data || data.student_id !== user.id) return { ok: false, error: "not_found" };

  const { data: signed, error: signError } = await createAdminClient()
    .storage.from("credentials")
    .createSignedUrl(data.pdf_path as string, DOWNLOAD_TTL_SECONDS, { download: pdfFileName(data.title as string) });
  if (signError || !signed) throw signError ?? new Error("Could not sign the download URL");

  return { ok: true, url: signed.signedUrl, expiresAt: Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SECONDS };
}

/** "Certificate of Enrollment.pdf": a safe file name from the title. */
export function pdfFileName(title: string): string {
  const base = title.replace(/[^\p{L}\p{N} ._-]+/gu, "").replace(/\s+/g, " ").trim().slice(0, 80);
  return `${base || "credential"}.pdf`;
}
