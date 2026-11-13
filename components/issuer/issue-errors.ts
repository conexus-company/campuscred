import { FALLBACK_MESSAGE } from "@/lib/chain/write";

/** Thrown for a non-OK issue API response; `message` is already friendly. */
export class IssueApiError extends Error {}

const API_MESSAGES: Record<string, string> = {
  unknown_student: "That student is not in the records.",
  too_large: "The PDF is over the 10 MB limit.",
  not_pdf: "That file is not a valid PDF.",
  hash_mismatch: "The file changed while uploading. Choose it again.",
  forbidden: "This wallet is not an issuer.",
  unauthorized: "Sign the message in MetaMask, then try again.",
  chain_unavailable: "BSC Testnet is not responding. Try again.",
  tx_not_valid: "The transaction is not confirmed yet. Try again.",
  mismatch: "That transaction is for a different credential.",
  not_found: "This credential is not in the records.",
  replace_not_found: "The credential being replaced is not in the records.",
  replace_wrong_student: "A re-issue must go to the same student as the original.",
  already_replaced: "That credential was already re-issued.",
};

/** Friendly message for an `{ error }` code from the /api/credentials/* routes. */
export const apiErrorMessage = (code: unknown): string =>
  typeof code === "string" && Object.hasOwn(API_MESSAGES, code) ? API_MESSAGES[code] : FALLBACK_MESSAGE;
