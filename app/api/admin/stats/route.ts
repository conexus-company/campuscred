import type { NextRequest } from "next/server";
import { WalletAuthError, requireAdmin, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

/** GET /api/admin/stats (pr-alvin.md 3.4, FR-13). Admin wallet signature required. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(verifyWalletAuth(req.headers));
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    return fail("unavailable", 503);
  }

  const db = createAdminClient();
  const count = { count: "exact", head: true } as const;
  const [issued, revoked, verified] = await Promise.all([
    db.from("credentials").select("*", count),
    db.from("credentials").select("*", count).eq("status", "revoked"),
    db.from("verifications").select("*", count),
  ]);
  if (issued.error || revoked.error || verified.error) return fail("unavailable", 503);
  return Response.json(
    { issued: issued.count ?? 0, verified: verified.count ?? 0, revoked: revoked.count ?? 0 },
    { headers },
  );
}
