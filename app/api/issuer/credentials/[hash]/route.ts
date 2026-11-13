import type { NextRequest } from "next/server";
import { isDocHash } from "@/lib/hash";
import {
  CREDENTIAL_COLUMNS,
  issuerScope,
  toIssuerCredential,
  type IssuerCredentialRow,
} from "@/lib/server/issuer-credentials";
import { WalletAuthError } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

/**
 * GET /api/issuer/credentials/[hash] (pr-alvin.md 3.4). Issuer or admin wallet signature required.
 * One credential with student name and number. Another issuer's credential is 404 unless the caller is admin.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/issuer/credentials/[hash]">) {
  let scope: Awaited<ReturnType<typeof issuerScope>>;
  try {
    scope = await issuerScope(req.headers);
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    return fail("unavailable", 503);
  }

  const hash = (await ctx.params).hash.toLowerCase();
  if (!isDocHash(hash)) return fail("not_found", 404);

  let query = createAdminClient().from("credentials").select(CREDENTIAL_COLUMNS).eq("doc_hash", hash);
  if (!scope.isAdmin) query = query.eq("issuer_wallet", scope.address);
  const { data, error } = await query.maybeSingle();
  if (error) return fail("unavailable", 503);
  if (!data) return fail("not_found", 404);
  return Response.json(toIssuerCredential(data as unknown as IssuerCredentialRow), { headers });
}
