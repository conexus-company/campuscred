import { FALLBACK_MESSAGE } from "@/lib/chain/write";

/** Thrown for a non-OK admin API response; `message` is already friendly. */
export class AdminApiError extends Error {}

const API_MESSAGES: Record<string, string> = {
  unauthorized: "Sign the message in MetaMask, then try again.",
  forbidden: "This wallet is not the registrar admin.",
  bad_request: "That transaction hash is not valid.",
  tx_not_valid: "The transaction is not confirmed yet. Try again.",
  chain_unavailable: "BSC Testnet is not responding. Try again.",
  unavailable: "The issuer list could not be updated. Try again.",
};

/** Friendly message for an `{ error }` code from /api/admin/*. */
export const adminErrorMessage = (code: unknown): string =>
  typeof code === "string" && Object.hasOwn(API_MESSAGES, code) ? API_MESSAGES[code] : FALLBACK_MESSAGE;
