import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/issuers (pr-alvin.md 3.4). Public, no auth.
 * 200 [{ wallet, displayName, active }]. Display names only.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const { data, error } = await createAdminClient().from("issuers").select("wallet, display_name, active");
  if (error) return Response.json({ error: "unavailable" }, { status: 503, headers });
  return Response.json(
    data.map((r) => ({ wallet: r.wallet.trim(), displayName: r.display_name, active: r.active })),
    { headers },
  );
}
