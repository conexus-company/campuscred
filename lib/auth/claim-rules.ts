/** Pure input checks for the /signup claim form. Shared by the server action and tests. */

export const MIN_PASSWORD = 8;

/** Sample student numbers look like 22-00001. Anything else is rejected before a query. */
const STUDENT_NO_RE = /^\d{2}-\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ClaimInput = { studentNo: string; email: string; password: string; confirm: string };
export type ClaimCheck = { studentNo: string; email: string; error: string | null };

export function validateClaim(input: ClaimInput): ClaimCheck {
  const studentNo = input.studentNo.trim();
  const email = input.email.trim().toLowerCase();
  const out = (error: string | null): ClaimCheck => ({ studentNo, email, error });

  if (!studentNo || !email || !input.password) return out("Fill in every field.");
  if (!STUDENT_NO_RE.test(studentNo)) return out("Enter your student number as it appears on your ID, like 22-00001.");
  if (!EMAIL_RE.test(email)) return out("Enter the email your registrar has on file.");
  if (input.password.length < MIN_PASSWORD) return out(`Use at least ${MIN_PASSWORD} characters for your password.`);
  if (input.password !== input.confirm) return out("The two passwords don’t match. Type them again.");
  return out(null);
}
