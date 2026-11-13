import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { runSync } from "@/lib/server/sync";

const headers = { "Cache-Control": "no-store" };

/** `Authorization: Bearer <SYNC_SECRET>`, compared in constant time. False when SYNC_SECRET is unset. */
function authorized(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * POST /api/sync (pr-alvin.md alvin/09-sync). Mirrors CampusCred events into Supabase from
 * sync_state.last_block. Idempotent. GET does the same so a Vercel Cron (which sends GET with
 * `Authorization: Bearer $CRON_SECRET`) can call it when CRON_SECRET equals SYNC_SECRET.
 * 200 { fromBlock, toBlock, latest, applied, skipped, caughtUp }
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401, headers });
  try {
    return Response.json(await runSync(), { headers });
  } catch (e) {
    console.error("[sync] failed", e);
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}

export const GET = POST;
