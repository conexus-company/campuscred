import { listMyCredentials } from "@/lib/auth/credentials";

/**
 * GET /api/students/me/credentials (pr-gil.md 3.4). Student session required.
 * 200 MyCredential[] (RLS-backed: own rows only), 401 { error: "unauthorized" }.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const credentials = await listMyCredentials();
    if (!credentials) return Response.json({ error: "unauthorized" }, { status: 401, headers });
    return Response.json(credentials, { headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
