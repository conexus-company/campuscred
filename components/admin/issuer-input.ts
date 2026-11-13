import { ZeroAddress, getAddress, isAddress } from "ethers";

export const MAX_NAME_LENGTH = 80;

export type IssuerInputResult =
  | { ok: true; wallet: string; name: string }
  | { ok: false; errors: { wallet?: string; name?: string } };

/** Add-issuer form rules. `activeWallets` are the wallets already approved, in any letter case. */
export function validateIssuerInput(wallet: string, name: string, activeWallets: readonly string[]): IssuerInputResult {
  const errors: { wallet?: string; name?: string } = {};
  const w = wallet.trim();
  const n = name.trim();

  if (!isAddress(w)) errors.wallet = "Enter a valid wallet address (0x followed by 40 hex characters).";
  else if (getAddress(w) === ZeroAddress) errors.wallet = "The zero address cannot be an issuer.";
  else if (activeWallets.some((a) => a.toLowerCase() === w.toLowerCase())) errors.wallet = "Already an approved issuer.";

  if (!n) errors.name = "Enter a display name.";
  else if (n.length > MAX_NAME_LENGTH) errors.name = `Keep the name to ${MAX_NAME_LENGTH} characters or fewer.`;

  return errors.wallet || errors.name ? { ok: false, errors } : { ok: true, wallet: getAddress(w), name: n };
}
