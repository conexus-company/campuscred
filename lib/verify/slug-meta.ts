// Server only: reads Supabase with the service-role key. Never import from a client component.
import { txUrl } from "@/lib/contract/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CredType, Hex } from "@/lib/types/credential";
import { MOCK_SLUG_ROWS } from "./mock-slugs";

/**
 * Public metadata for a share link (pr-gil.md 3.4, GET /api/verify/[slug]).
 * Only these fields ever leave the server: no student name, number, email or PDF path.
 */
export type SlugMeta = {
  docHash: Hex;
  credType: CredType;
  title: string;
  issuerName: string;
  issuerWallet: Hex;
  /** Unix seconds, like the chain. */
  issuedAt: number;
  txUrl: string;
};

/** The database could not be read. Callers show a retry, not "No record found". */
export class SlugLookupError extends Error {
  constructor(cause?: unknown) {
    super("Could not load this credential. Try again.", { cause });
    this.name = "SlugLookupError";
  }
}

/** Slugs are 10 random characters (alvin/03 schema). Anything else is rejected before a query. */
const SLUG_RE = /^[A-Za-z0-9_-]{4,64}$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** One row of `credentials` joined with `issuers`, as selected below. */
export type CredentialRow = {
  doc_hash: string;
  cred_type: string;
  title: string;
  issuer_wallet: string;
  issued_at: string;
  issue_tx: string;
  is_public: boolean;
  issuers: { display_name: string } | { display_name: string }[] | null;
};

/** Pure mapping from a database row. Private rows map to null, the same as unknown slugs. */
export function toSlugMeta(row: CredentialRow | null): SlugMeta | null {
  if (!row || !row.is_public) return null;
  const issuer = Array.isArray(row.issuers) ? row.issuers[0] : row.issuers;
  return {
    docHash: row.doc_hash.trim() as Hex,
    credType: row.cred_type as CredType,
    title: row.title,
    issuerName: issuer?.display_name ?? row.issuer_wallet.trim(),
    issuerWallet: row.issuer_wallet.trim() as Hex,
    issuedAt: Math.floor(new Date(row.issued_at).getTime() / 1000),
    txUrl: txUrl(row.issue_tx.trim() as Hex),
  };
}

function mockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_CHAIN === "true";
}

/**
 * Looks up a share slug. Returns null when the slug is unknown, malformed or
 * private (rule 3.7.3: all three show Not found). Throws SlugLookupError when
 * the database cannot be reached.
 */
export async function getSlugMeta(slug: string): Promise<SlugMeta | null> {
  if (!isValidSlug(slug)) return null;

  if (mockMode()) {
    const row = MOCK_SLUG_ROWS[slug];
    if (!row || !row.isPublic) return null;
    const { docHash, credType, title, issuerName, issuerWallet, issuedAt, issueTx } = row;
    return { docHash, credType, title, issuerName, issuerWallet, issuedAt, txUrl: txUrl(issueTx) };
  }

  try {
    const { data, error } = await createAdminClient()
      .from("credentials")
      .select("doc_hash, cred_type, title, issuer_wallet, issued_at, issue_tx, is_public, issuers(display_name)")
      .eq("share_slug", slug)
      .maybeSingle();
    if (error) throw error;
    return toSlugMeta(data as unknown as CredentialRow | null);
  } catch (err) {
    throw new SlugLookupError(err);
  }
}
