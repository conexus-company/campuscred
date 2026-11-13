export type Hex = `0x${string}`;
export const CHAIN_ID = 97 as const;
// Placeholder until the contract is deployed at CP2 (alvin/02-deploy).
export const CONTRACT_ADDRESS: Hex = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Hex;
export const RPC_URLS: string[] = [
  process.env.NEXT_PUBLIC_RPC_URL_PRIMARY ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  process.env.NEXT_PUBLIC_RPC_URL_FALLBACK ?? "https://bsc-testnet-rpc.publicnode.com",
];
export const EXPLORER_URL = "https://testnet.bscscan.com" as const;
export const txUrl = (hash: Hex): string => `${EXPLORER_URL}/tx/${hash}`;
