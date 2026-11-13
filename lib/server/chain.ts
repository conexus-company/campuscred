import { Contract, FallbackProvider, Interface, JsonRpcProvider, ZeroHash, id } from "ethers";
import { CAMPUSCRED_ABI } from "@/lib/contract/CampusCred.abi";
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URLS, type Hex } from "@/lib/contract/config";

const iface = new Interface(CAMPUSCRED_ABI);

// staticNetwork: never probe eth_chainId; priority order = RPC_URLS order.
const provider = new FallbackProvider(
  RPC_URLS.map((url, i) => ({
    provider: new JsonRpcProvider(url, CHAIN_ID, { staticNetwork: true }),
    priority: i + 1,
  })),
  CHAIN_ID,
  { quorum: 1 },
);
const contract = new Contract(CONTRACT_ADDRESS, CAMPUSCRED_ABI, provider);

const ROLES = { issuer: id("ISSUER_ROLE"), admin: ZeroHash } as const;

export async function hasRole(role: keyof typeof ROLES, address: string): Promise<boolean> {
  return contract.hasRole(ROLES[role], address);
}

type Log = { address: string; topics: readonly string[]; data: string };
export type IssuedFields = { docHash: Hex; studentRef: Hex; credType: Hex; issuer: Hex };
export type RevokedFields = { docHash: Hex; reason: Hex; by: Hex };
type Mined<T> = T & { blockNumber: number; timestamp: number };

function findEvent(logs: readonly Log[], name: string, contractAddress: string) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
    const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
    if (parsed?.name === name) return parsed.args;
  }
  return null;
}

/** Pure: first CredentialIssued log emitted by `contractAddress`, or null. */
export function decodeIssuedLog(logs: readonly Log[], contractAddress: string = CONTRACT_ADDRESS): IssuedFields | null {
  const a = findEvent(logs, "CredentialIssued", contractAddress);
  return a && { docHash: a.docHash, studentRef: a.studentRef, credType: a.credType, issuer: a.issuer };
}

/** Pure: first CredentialRevoked log emitted by `contractAddress`, or null. */
export function decodeRevokedLog(logs: readonly Log[], contractAddress: string = CONTRACT_ADDRESS): RevokedFields | null {
  const a = findEvent(logs, "CredentialRevoked", contractAddress);
  return a && { docHash: a.docHash, reason: a.reason, by: a.by };
}

// Only the tx hash comes from the client; everything else is read from the chain.
async function minedEvent<T>(txHash: string, decode: (logs: readonly Log[]) => T | null): Promise<Mined<T> | null> {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) return null;
  if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) return null;
  const fields = decode(receipt.logs);
  if (!fields) return null;
  const block = await provider.getBlock(receipt.blockNumber);
  if (!block) return null;
  return { ...fields, blockNumber: receipt.blockNumber, timestamp: block.timestamp };
}

export const getIssuedEvent = (txHash: string) => minedEvent(txHash, (logs) => decodeIssuedLog(logs));
export const getRevokedEvent = (txHash: string) => minedEvent(txHash, (logs) => decodeRevokedLog(logs));
