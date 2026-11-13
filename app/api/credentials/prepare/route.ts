import type { NextRequest } from "next/server";
import { CRED_TYPES, encodeCredType, type CredType } from "@/lib/contract/codes";
import { isDocHash } from "@/lib/hash";
import { checkPdf, sha256Bytes } from "@/lib/server/issue";
import { studentRef } from "@/lib/server/student-ref";
import { WalletAuthError, requireIssuer, verifyWalletAuth } from "@/lib/server/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

/**
 * POST /api/credentials/prepare (pr-alvin.md 3.4). Issuer wallet signature required.
 * multipart: file, studentNo, credType, title, docHash.
 * Re-hashes the file on the server, stores it in the private bucket and returns
 * the values the wallet passes to issueCredential.
 * 200 { docHash, studentRef, credType32, pdfPath }
 */
export async function POST(req: NextRequest) {
  try {
    await requireIssuer(verifyWalletAuth(req.headers));
  } catch (e) {
    if (e instanceof WalletAuthError) return fail(e.code, e.status);
    return fail("unavailable", 503);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_request", 400);
  }
  const file = form.get("file");
  const studentNo = String(form.get("studentNo") ?? "").trim();
  const credType = String(form.get("credType") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const docHash = String(form.get("docHash") ?? "").toLowerCase();
  if (
    !(file instanceof File) ||
    !studentNo ||
    !(CRED_TYPES as readonly string[]).includes(credType) ||
    !title ||
    title.length > 200 ||
    !isDocHash(docHash)
  ) {
    return fail("bad_request", 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfError = checkPdf(bytes);
  if (pdfError) return fail(pdfError, pdfError === "too_large" ? 413 : 400);
  if (sha256Bytes(bytes) !== docHash) return fail("hash_mismatch", 400);

  const db = createAdminClient();
  const { data: student, error } = await db.from("students").select("id").eq("student_no", studentNo).maybeSingle();
  if (error) return fail("unavailable", 503);
  if (!student) return fail("unknown_student", 404);

  const pdfPath = `${docHash}.pdf`;
  // upsert: a retry after a failed transaction re-uploads the same bytes under the same hash.
  const upload = await db.storage
    .from("credentials")
    .upload(pdfPath, bytes, { contentType: "application/pdf", upsert: true });
  if (upload.error) return fail("unavailable", 503);

  return Response.json(
    { docHash, studentRef: studentRef(studentNo), credType32: encodeCredType(credType as CredType), pdfPath },
    { headers },
  );
}
