// Shared by the client signer and the server verifier (lib/server/wallet-auth.ts).
// Headers cannot carry newlines, so the client sends the parts and the server rebuilds the message.

export const WALLET_ADDRESS_HEADER = "x-wallet-address";
export const WALLET_NONCE_HEADER = "x-wallet-nonce";
export const WALLET_ISSUED_HEADER = "x-wallet-issued"; // ISO time
export const WALLET_SIGNATURE_HEADER = "x-wallet-signature";

export const buildAuthMessage = (nonce: string, issued: string): string =>
  `CampusCred auth\nnonce: ${nonce}\nissued: ${issued}`;
