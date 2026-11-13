import type { NextRequest } from "next/server";
import { setVisibility } from "@/lib/auth/credentials";

/**
 * PATCH /api/credentials/[hash]/visibility (pr-gil.md 3.4, FR-12). Student session required.
 * Body { isPublic: boolean }. 200 { isPublic }; 400 bad body; 401 no session; 404 not the owner's.
 * A hidden credential answers Not found on its public link (lib/verify/slug-meta.ts).
 */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/credentials/[hash]/visibility">) {
  const { hash } = await ctx.params;
  const headers = { "Cache-Control": "no-store" };

  let isPublic: unknown;
  try {
    ({ isPublic } = (await req.json()) as { isPublic?: unknown });
  } catch {
    isPublic = undefined;
  }
  if (typeof isPublic !== "boolean") return Response.json({ error: "bad_request" }, { status: 400, headers });

  try {
    const result = await setVisibility(hash, isPublic);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.error === "unauthorized" ? 401 : 404, headers });
    }
    return Response.json({ isPublic: result.isPublic }, { headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
