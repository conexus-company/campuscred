export type Hex = `0x${string}`;
export const CHAIN_ID = 97 as const;
// Deployed and verified on BSC Testnet: https://testnet.bscscan.com/address/0xeaB106368d62bb62956da2881F42e07C8f2279Dc#code
export const CONTRACT_ADDRESS: Hex = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0xeaB106368d62bb62956da2881F42e07C8f2279Dc") as Hex;
export const RPC_URLS: string[] = [
  process.env.NEXT_PUBLIC_RPC_URL_PRIMARY ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  process.env.NEXT_PUBLIC_RPC_URL_FALLBACK ?? "https://bsc-testnet.publicnode.com",
];
export const EXPLORER_URL = "https://testnet.bscscan.com" as const;
export const txUrl = (hash: Hex): string => `${EXPLORER_URL}/tx/${hash}`;
