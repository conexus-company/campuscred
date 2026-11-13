import type { NextRequest } from "next/server";
import { decodeCredType } from "@/lib/contract/codes";
import { txUrl, type Hex } from "@/lib/contract/config";
import { isDocHash } from "@/lib/hash";
import { getIssuedEvent } from "@/lib/server/chain";
import { newSlug } from "@/lib/server/issue";
import { WalletAuthError, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
const ok = (row: { share_slug: string; issue_tx: string }) =>
  Response.json({ slug: row.share_slug, txUrl: txUrl(row.issue_tx.trim() as Hex) }, { headers });

/**
 * POST /api/credentials/confirm (pr-alvin.md 3.4). Wallet signature required.
 * Body { docHash, txHash, title }. `title` is added to the spec: it is not on chain.
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

  const body = (await req.json().catch(() => null)) as { docHash?: unknown; txHash?: unknown; title?: unknown } | null;
  const docHash = typeof body?.docHash === "string" ? body.docHash.toLowerCase() : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash.toLowerCase() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  // isDocHash is a 32-byte hex check, which also fits a transaction hash.
  if (!isDocHash(docHash) || !isDocHash(txHash) || !title || title.length > 200) return fail("bad_request", 400);

  const db = createAdminClient();
  const existing = () =>
    db.from("credentials").select("share_slug, issue_tx").eq("doc_hash", docHash).maybeSingle();

  const found = await existing();
  if (found.error) return fail("unavailable", 503);
  if (found.data) return ok(found.data);

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

  const row = {
    doc_hash: docHash,
    student_id: student.data.id,
    issuer_wallet: event.issuer,
    cred_type: credType,
    title,
    pdf_path: `${docHash}.pdf`,
    status: "active",
    issue_tx: txHash,
    issued_at: new Date(event.timestamp * 1000).toISOString(),
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const share_slug = newSlug();
    const { error } = await db.from("credentials").insert({ ...row, share_slug });
    if (!error) return ok({ share_slug, issue_tx: txHash });
    if (error.code !== "23505") return fail("unavailable", 503);
    if (!/share_slug/.test(`${error.message} ${error.details}`)) {
      // Another confirm for the same docHash won the race: return its row.
      const raced = await existing();
      return raced.data ? ok(raced.data) : fail("unavailable", 503);
    }
  }
  return fail("unavailable", 503);
}
