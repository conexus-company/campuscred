// Shared by /api/credentials/confirm and /api/credentials/batch. Server only.
import type { createAdminClient } from "@/lib/supabase/admin";
import { newSlug } from "./issue";

type Db = ReturnType<typeof createAdminClient>;
export type CredentialRow = {
  doc_hash: string;
  student_id: string;
  issuer_wallet: string;
  cred_type: string;
  title: string;
  pdf_path: string;
  status: "active";
  issue_tx: string;
  issued_at: string;
};
export type Saved = { share_slug: string; issue_tx: string };

export const findCredential = (db: Db, docHash: string) =>
  db.from("credentials").select("share_slug, issue_tx").eq("doc_hash", docHash).maybeSingle();

/**
 * Inserts the row with a fresh share slug, retrying on a slug collision.
 * Idempotent: if another request already saved this doc_hash, returns that row. Null on a DB failure.
 */
export async function insertCredential(db: Db, row: CredentialRow): Promise<Saved | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const share_slug = newSlug();
    const { error } = await db.from("credentials").insert({ ...row, share_slug });
    if (!error) return { share_slug, issue_tx: row.issue_tx };
    if (error.code !== "23505") return null;
    if (!/share_slug/.test(`${error.message} ${error.details}`)) {
      // Another confirm for the same docHash won the race: return its row.
      const raced = await findCredential(db, row.doc_hash);
      return raced.data ?? null;
    }
  }
  return null;
}
