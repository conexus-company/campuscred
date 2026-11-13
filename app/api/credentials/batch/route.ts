import type { NextRequest } from "next/server";
import { decodeCredType } from "@/lib/contract/codes";
import { txUrl, type Hex } from "@/lib/contract/config";
import { isDocHash } from "@/lib/hash";
import { getIssuedEvents } from "@/lib/server/chain";
import { insertCredential } from "@/lib/server/insert-credential";
import { WalletAuthError, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
const MAX_BATCH = 50; // CampusCred.sol MAX_BATCH

type Item = { docHash: string; title: string };
type Result = { docHash: string; slug?: string; error?: string };

/**
 * POST /api/credentials/batch (pr-alvin.md alvin/12). Wallet signature required.
 * Body { txHash, items: [{ docHash, title }] } for one mined issueBatch transaction.
 * Like /confirm, trusts only the chain: student, type and issuer come from each CredentialIssued event.
 * Idempotent per docHash. 200 { txUrl, results: [{ docHash, slug } | { docHash, error }] } in item order.
 */
export async function POST(req: NextRequest) {
  let signer: Hex;
  try {
    signer = verifyWalletAuth(req.headers);
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    throw e;
  }

  const body = (await req.json().catch(() => null)) as { txHash?: unknown; items?: unknown } | null;
  const txHash = typeof body?.txHash === "string" ? body.txHash.toLowerCase() : "";
  const raw = Array.isArray(body?.items) ? body.items : [];
  const items: Item[] = raw.map((i: { docHash?: unknown; title?: unknown }) => ({
    docHash: typeof i?.docHash === "string" ? i.docHash.toLowerCase() : "",
    title: typeof i?.title === "string" ? i.title.trim() : "",
  }));
  if (
    !isDocHash(txHash) ||
    items.length === 0 ||
    items.length > MAX_BATCH ||
    items.some((i) => !isDocHash(i.docHash) || !i.title || i.title.length > 200)
  ) {
    return fail("bad_request", 400);
  }

  let mined: Awaited<ReturnType<typeof getIssuedEvents>>;
  try {
    mined = await getIssuedEvents(txHash);
  } catch {
    return fail("chain_unavailable", 503);
  }
  if (!mined) return fail("tx_not_valid", 422);
  const events = new Map(mined.events.map((e) => [e.docHash.toLowerCase(), e]));

  const db = createAdminClient();
  const refs = [...new Set(mined.events.map((e) => e.studentRef.toLowerCase()))];
  const [students, existing] = await Promise.all([
    db.from("students").select("id, student_ref").in("student_ref", refs),
    db.from("credentials").select("doc_hash, share_slug").in("doc_hash", items.map((i) => i.docHash)),
  ]);
  if (students.error || existing.error) return fail("unavailable", 503);
  const studentId = new Map(students.data.map((s) => [s.student_ref.toLowerCase(), s.id]));
  const saved = new Map(existing.data.map((c) => [c.doc_hash.toLowerCase(), c.share_slug]));
  const issuedAt = new Date(mined.timestamp * 1000).toISOString();

  const results: Result[] = [];
  for (const { docHash, title } of items) {
    const known = saved.get(docHash);
    if (known) {
      results.push({ docHash, slug: known });
      continue;
    }
    const event = events.get(docHash);
    if (!event) {
      results.push({ docHash, error: "mismatch" });
      continue;
    }
    if (event.issuer.toLowerCase() !== signer.toLowerCase()) {
      results.push({ docHash, error: "forbidden" });
      continue;
    }
    const credType = decodeCredType(event.credType);
    const student_id = studentId.get(event.studentRef.toLowerCase());
    if (credType === "UNKNOWN" || !student_id) {
      results.push({ docHash, error: credType === "UNKNOWN" ? "unknown_cred_type" : "unknown_student" });
      continue;
    }
    const row = await insertCredential(db, {
      doc_hash: docHash,
      student_id,
      issuer_wallet: event.issuer,
      cred_type: credType,
      title,
      pdf_path: `${docHash}.pdf`,
      status: "active",
      issue_tx: txHash,
      issued_at: issuedAt,
    });
    results.push(row ? { docHash, slug: row.share_slug } : { docHash, error: "unavailable" });
  }

  return Response.json({ txUrl: txUrl(txHash as Hex), results }, { headers });
}
