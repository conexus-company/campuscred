import { after, type NextRequest } from "next/server";
import type { Hex } from "@/lib/contract/config";
import { isDocHash } from "@/lib/hash";
import { getRevokedEvent } from "@/lib/server/chain";
import { revokeEventError, revokedFields } from "@/lib/server/issue";
import { WalletAuthError, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { runSync } from "@/lib/server/sync";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
const ok = () => Response.json({ ok: true }, { headers });

/**
 * POST /api/credentials/[hash]/revoke-confirm (pr-alvin.md alvin/08). Wallet signature required.
 * Body { txHash }. Never trusts the client: the reason and time come from the mined
 * CredentialRevoked event, and the chain already decided who may revoke.
 * Idempotent: a credential already revoked by this tx returns 200.
 * 200 { ok: true }
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/credentials/[hash]/revoke-confirm">) {
  let signer: Hex;
  try {
    signer = verifyWalletAuth(req.headers);
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    throw e;
  }

  const docHash = (await ctx.params).hash.toLowerCase();
  // Mirror any other new events too, after the response, so the dashboard is current without a cron.
  after(() => runSync().catch((e) => console.warn("[sync] after confirm failed", e)));

  const body = (await req.json().catch(() => null)) as { txHash?: unknown } | null;
  const txHash = typeof body?.txHash === "string" ? body.txHash.toLowerCase() : "";
  // isDocHash is a 32-byte hex check, which also fits a transaction hash.
  if (!isDocHash(docHash) || !isDocHash(txHash)) return fail("bad_request", 400);

  const db = createAdminClient();
  const found = await db.from("credentials").select("status, revoke_tx").eq("doc_hash", docHash).maybeSingle();
  if (found.error) return fail("unavailable", 503);
  if (!found.data) return fail("not_found", 404);
  if (found.data.status === "revoked" && found.data.revoke_tx?.trim().toLowerCase() === txHash) return ok();

  let event: Awaited<ReturnType<typeof getRevokedEvent>>;
  try {
    event = await getRevokedEvent(txHash);
  } catch {
    return fail("chain_unavailable", 503);
  }
  if (!event) return fail("tx_not_valid", 422);

  const bad = revokeEventError(event, docHash, signer);
  if (bad) return fail(bad, bad === "forbidden" ? 403 : 422);

  const { error } = await db.from("credentials").update(revokedFields(event, txHash)).eq("doc_hash", docHash);
  if (error) return fail("unavailable", 503);
  return ok();
}
