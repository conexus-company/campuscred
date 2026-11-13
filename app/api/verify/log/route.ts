import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseLogEntry } from "@/lib/verify/log-rules";

/**
 * POST /api/verify/log (pr-gil.md 3.4). Public. Body { docHash, result, method }.
 * Writes one `verifications` row with only those three fields; checked_at is set by the
 * database. Nothing from the request (IP, user agent, cookies) is read or stored.
 * 204 on success, 400 on a bad body, 503 if the database is unreachable.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const entry = parseLogEntry(body);
  if (!entry) return Response.json({ error: "bad_request" }, { status: 400 });

  try {
    const { error } = await createAdminClient()
      .from("verifications")
      .insert({ doc_hash: entry.docHash, result: entry.result, method: entry.method });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
