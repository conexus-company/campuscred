import type { NextRequest } from "next/server";
import { searchTerm } from "@/lib/server/issue";
import { WalletAuthError, requireIssuer, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };

/**
 * GET /api/issuer/students?q= (pr-alvin.md 3.4). Issuer wallet signature required.
 * 200 [{ studentNo, fullName }], at most 10. The only route that shows names to a non-owner.
 */
export async function GET(req: NextRequest) {
  try {
    await requireIssuer(verifyWalletAuth(req.headers));
  } catch (e) {
    if (e instanceof WalletAuthError) return Response.json({ error: e.code }, { status: e.status, headers });
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }

  const term = searchTerm(req.nextUrl.searchParams.get("q"));
  if (!term) return Response.json([], { headers });

  const { data, error } = await createAdminClient()
    .from("students")
    .select("student_no, full_name")
    .or(`full_name.ilike.%${term}%,student_no.ilike.%${term}%`)
    .order("full_name")
    .limit(10);
  if (error) return Response.json({ error: "unavailable" }, { status: 503, headers });
  return Response.json(
    data.map((s) => ({ studentNo: s.student_no, fullName: s.full_name })),
    { headers },
  );
}
