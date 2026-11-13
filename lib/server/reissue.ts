// Re-issue rules for POST /api/credentials/confirm (alvin/15-reissue). Server only.

export type ReplaceTarget = { student_id: string | null; issuer_wallet: string } | null;
export type ReplaceError = "replace_not_found" | "replace_wrong_student" | "forbidden" | "already_replaced";

/**
 * Null when the new credential `docHash` may replace `old`. Mirrors the contract's revoke rule:
 * only old's issuer or the admin. `replacedBy` is the credential already replacing old, if any.
 */
export function replaceError(
  old: ReplaceTarget,
  ctx: { docHash: string; studentId: string; signer: string; isAdmin: boolean; replacedBy: string | null },
): ReplaceError | null {
  if (!old) return "replace_not_found";
  if (old.student_id !== ctx.studentId) return "replace_wrong_student";
  if (!ctx.isAdmin && old.issuer_wallet.trim().toLowerCase() !== ctx.signer.toLowerCase()) return "forbidden";
  if (ctx.replacedBy && ctx.replacedBy.trim().toLowerCase() !== ctx.docHash.toLowerCase()) return "already_replaced";
  return null;
}
