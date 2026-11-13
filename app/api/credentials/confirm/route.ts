import { after, type NextRequest } from "next/server";
import { decodeCredType } from "@/lib/contract/codes";
import { txUrl, type Hex } from "@/lib/contract/config";
import { isDocHash } from "@/lib/hash";
import { getIssuedEvent, hasRole } from "@/lib/server/chain";
import { replaceError } from "@/lib/server/reissue";
import { findCredential, insertCredential } from "@/lib/server/insert-credential";
import { WalletAuthError, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { runSync } from "@/lib/server/sync";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
const ok = (row: { share_slug: string; issue_tx: string }) =>
  Response.json({ slug: row.share_slug, txUrl: txUrl(row.issue_tx.trim() as Hex) }, { headers });

/**
 * POST /api/credentials/confirm (pr-alvin.md 3.4). Wallet signature required.
 * Body { docHash, txHash, title, replaces? }. `title` is added to the spec: it is not on chain.
 * `replaces` (re-issue): the credential this one corrects; same student, signer is its issuer or admin.
 * Never trusts the client: docHash, studentRef, credType and issuer come from the
 * mined CredentialIssued event. Idempotent: a known docHash returns its existing slug.
 * 200 { slug, txUrl }
 */
export async function POST(req: NextRequest) {
  let signer: Hex;
  try {
    signer = verifyWalletAuth(req.headers);
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    throw e;
  }

  // Mirror any other new events too, after the response, so the dashboard is current without a cron.
  after(() => runSync().catch((e) => console.warn("[sync] after confirm failed", e)));

  const body = (await req.json().catch(() => null)) as
    | { docHash?: unknown; txHash?: unknown; title?: unknown; replaces?: unknown }
    | null;
  const docHash = typeof body?.docHash === "string" ? body.docHash.toLowerCase() : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash.toLowerCase() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const replaces = typeof body?.replaces === "string" ? body.replaces.toLowerCase() : null;
  // isDocHash is a 32-byte hex check, which also fits a transaction hash.
  if (!isDocHash(docHash) || !isDocHash(txHash) || !title || title.length > 200) return fail("bad_request", 400);
  if (replaces !== null && (!isDocHash(replaces) || replaces === docHash)) return fail("bad_request", 400);

  const db = createAdminClient();
  const found = await findCredential(db, docHash);
  if (found.error) return fail("unavailable", 503);
  // A re-issue still checks and records the link when the row exists (e.g. the event sync saved it first).
  if (found.data && !replaces) return ok(found.data);

  let event: Awaited<ReturnType<typeof getIssuedEvent>>;
  try {
    event = await getIssuedEvent(txHash);
  } catch {
    return fail("chain_unavailable", 503);
  }
  if (!event) return fail("tx_not_valid", 422);
  if (event.docHash.toLowerCase() !== docHash) return fail("mismatch", 422);
  if (event.issuer.toLowerCase() !== signer.toLowerCase()) return fail("forbidden", 403);
  const credType = decodeCredType(event.credType);
  if (credType === "UNKNOWN") return fail("unknown_cred_type", 422);

  const student = await db.from("students").select("id").eq("student_ref", event.studentRef.toLowerCase()).maybeSingle();
  if (student.error) return fail("unavailable", 503);
  if (!student.data) return fail("unknown_student", 422);

  if (replaces) {
    const [old, next] = await Promise.all([
      db.from("credentials").select("student_id, issuer_wallet").eq("doc_hash", replaces).maybeSingle(),
      db.from("credentials").select("doc_hash").eq("replaces", replaces).maybeSingle(),
    ]);
    if (old.error || next.error) return fail("unavailable", 503);
    const ownOld = old.data?.issuer_wallet.trim().toLowerCase() === signer.toLowerCase();
    let isAdmin = false;
    try {
      if (old.data && !ownOld) isAdmin = await hasRole("admin", signer);
    } catch {
      return fail("chain_unavailable", 503);
    }
    const bad = replaceError(old.data, {
      docHash,
      studentId: student.data.id,
      signer,
      isAdmin,
      replacedBy: next.data?.doc_hash ?? null,
    });
    if (bad) return fail(bad, bad === "forbidden" ? 403 : 422);
    if (found.data) {
      const linked = await db.from("credentials").update({ replaces }).eq("doc_hash", docHash).is("replaces", null);
      return linked.error ? fail("unavailable", 503) : ok(found.data);
    }
  }

  const row = {
    doc_hash: docHash,
    student_id: student.data.id,
    issuer_wallet: event.issuer,
    cred_type: credType,
    title,
    pdf_path: `${docHash}.pdf`,
    status: "active" as const,
    issue_tx: txHash,
    issued_at: new Date(event.timestamp * 1000).toISOString(),
    ...(replaces && { replaces }),
  };

  const saved = await insertCredential(db, row);
  return saved ? ok(saved) : fail("unavailable", 503);
}
