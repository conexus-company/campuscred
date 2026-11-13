import type { NextRequest } from "next/server";
import { createDownloadUrl } from "@/lib/auth/credentials";

/**
 * POST /api/credentials/[hash]/download-url (pr-gil.md 3.4). Student session required.
 * 200 { url, expiresAt } with a 60-second signed URL, only for the owner's own credential.
 * 401 without a session; 404 for an unknown hash or someone else's credential (same answer,
 * so the response never confirms that another student's credential exists).
 */
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/credentials/[hash]/download-url">) {
  const { hash } = await ctx.params;
  const headers = { "Cache-Control": "no-store" };
  try {
    const result = await createDownloadUrl(hash);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.error === "unauthorized" ? 401 : 404, headers });
    }
    return Response.json({ url: result.url, expiresAt: result.expiresAt }, { headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
