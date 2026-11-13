import type { NextRequest } from "next/server";
import { getSlugMeta } from "@/lib/verify/slug-meta";

/**
 * GET /api/verify/[slug] (pr-gil.md 3.4). Public, no auth.
 * 200 { docHash, credType, title, issuerName, issuerWallet, issuedAt, txUrl }
 * 404 { error: "not_found" } for an unknown or private slug.
 * Never returns a student name, number or email.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/verify/[slug]">) {
  const { slug } = await ctx.params;
  // Not cached: a student can make a credential private at any time.
  const headers = { "Cache-Control": "no-store" };

  try {
    const meta = await getSlugMeta(slug);
    if (!meta) return Response.json({ error: "not_found" }, { status: 404, headers });
    return Response.json(meta, { headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
