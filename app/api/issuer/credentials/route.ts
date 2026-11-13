import type { NextRequest } from "next/server";
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
 * GET /api/issuer/credentials (pr-alvin.md 3.4). Issuer or admin wallet signature required.
 * The signing wallet's credentials, newest first; an admin sees every issuer's.
 */
export async function GET(req: NextRequest) {
  let scope: Awaited<ReturnType<typeof issuerScope>>;
  try {
    scope = await issuerScope(req.headers);
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    return fail("unavailable", 503);
  }

  // shortcut: no pagination; add .range() once an issuer has more than a few hundred credentials.
  let query = createAdminClient().from("credentials").select(CREDENTIAL_COLUMNS).order("issued_at", { ascending: false });
  if (!scope.isAdmin) query = query.eq("issuer_wallet", scope.address);
  const { data, error } = await query;
  if (error) return fail("unavailable", 503);
  return Response.json((data as unknown as IssuerCredentialRow[]).map(toIssuerCredential), { headers });
}
