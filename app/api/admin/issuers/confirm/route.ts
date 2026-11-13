import type { NextRequest } from "next/server";
import { isDocHash } from "@/lib/hash";
import { issuerRowChange } from "@/lib/server/admin-issuers";
import { getIssuerEvent, hasRole } from "@/lib/server/chain";
import { WalletAuthError, requireAdmin, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
const ok = () => Response.json({ ok: true }, { headers });

/**
 * POST /api/admin/issuers/confirm (alvin/10-admin). Admin wallet signature required.
 * Body { txHash }. Mirrors a mined IssuerAdded or IssuerRemoved event into `issuers`, so a new
 * issuer can save credentials (credentials.issuer_wallet references issuers.wallet).
 * Wallet and name come from the event, never the client; `active` is the wallet's current on-chain role.
 * Idempotent: the same tx twice writes the same row.
 * 200 { ok: true }
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(verifyWalletAuth(req.headers));
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    return fail("chain_unavailable", 503); // the hasRole read failed
  }

  const body = (await req.json().catch(() => null)) as { txHash?: unknown } | null;
  const txHash = typeof body?.txHash === "string" ? body.txHash.toLowerCase() : "";
  // isDocHash is a 32-byte hex check, which also fits a transaction hash.
  if (!isDocHash(txHash)) return fail("bad_request", 400);

  let change: ReturnType<typeof issuerRowChange>;
  try {
    const event = await getIssuerEvent(txHash);
    if (!event) return fail("tx_not_valid", 422);
    change = issuerRowChange(event, await hasRole("issuer", event.wallet));
  } catch {
    return fail("chain_unavailable", 503);
  }

  const issuers = createAdminClient().from("issuers");
  const { error } =
    change.kind === "upsert"
      ? await issuers.upsert(change.row, { onConflict: "wallet" })
      : await issuers.update({ active: change.active }).eq("wallet", change.wallet);
  if (error) return fail("unavailable", 503);
  return ok();
}
