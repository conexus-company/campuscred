"use client";

import { BrowserProvider, Contract, ZeroHash, id } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAMPUSCRED_ABI } from "@/lib/contract/CampusCred.abi";
import { CHAIN_ID, CONTRACT_ADDRESS, EXPLORER_URL, RPC_URLS, type Hex } from "@/lib/contract/config";
import {
  WALLET_ADDRESS_HEADER,
  WALLET_ISSUED_HEADER,
  WALLET_NONCE_HEADER,
  WALLET_SIGNATURE_HEADER,
  buildAuthMessage,
} from "./auth-message";

type Eip1193 = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
};

export type WalletStatus = "checking" | "no-wallet" | "disconnected" | "wrong-chain" | "error" | "ready";

type WalletState = {
  status: WalletStatus;
  address: Hex | null;
  isIssuer: boolean;
  isAdmin: boolean;
  provider: BrowserProvider | null;
};

const INITIAL: WalletState = { status: "checking", address: null, isIssuer: false, isAdmin: false, provider: null };
const CHAIN_HEX = `0x${CHAIN_ID.toString(16)}`;
const ISSUER_ROLE = id("ISSUER_ROLE");
const ADMIN_ROLE = ZeroHash; // DEFAULT_ADMIN_ROLE

const getEthereum = () => (window as { ethereum?: Eip1193 }).ethereum;

/** Switch MetaMask to BSC Testnet, adding the network first if MetaMask does not know it. */
async function switchChain(eth: Eip1193): Promise<void> {
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err) {
    const e = err as { code?: number; data?: { originalError?: { code?: number } } };
    if (e.code !== 4902 && e.data?.originalError?.code !== 4902) throw err;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: "BNB Smart Chain Testnet",
          nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
          rpcUrls: RPC_URLS,
          blockExplorerUrls: [EXPLORER_URL],
        },
      ],
    });
  }
}

/**
 * MetaMask connection, BSC Testnet check and on-chain roles.
 * shortcut: state is per hook instance (no context provider); lift into a WalletProvider if duplicate role reads become a problem.
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>(INITIAL);
  const run = useRef(0); // drops results from a sync that a newer account or chain change superseded

  const refresh = useCallback(async () => {
    const ticket = ++run.current;
    const set = (next: Partial<WalletState>) => {
      if (ticket === run.current) setState({ ...INITIAL, ...next });
    };
    const eth = getEthereum();
    if (!eth) return set({ status: "no-wallet" });
    try {
      const [account] = (await eth.request({ method: "eth_accounts" })) as string[];
      if (!account) return set({ status: "disconnected" });
      if (Number(await eth.request({ method: "eth_chainId" })) !== CHAIN_ID) {
        return set({ status: "wrong-chain", address: account as Hex });
      }
      // A new BrowserProvider per sync: ethers v6 providers fail after a network change.
      const provider = new BrowserProvider(eth, CHAIN_ID);
      const contract = new Contract(CONTRACT_ADDRESS, CAMPUSCRED_ABI, provider);
      const [isIssuer, isAdmin] = (await Promise.all([
        contract.hasRole(ISSUER_ROLE, account),
        contract.hasRole(ADMIN_ROLE, account),
      ])) as [boolean, boolean];
      set({ status: "ready", address: account as Hex, isIssuer, isAdmin, provider });
    } catch {
      set({ status: "error" }); // RPC failure: never show it as "wrong role"
    }
  }, []);

  useEffect(() => {
    const eth = getEthereum();
    const onChange = () => void refresh();
    void Promise.resolve().then(refresh); // first sync after mount, outside the effect body
    eth?.on("accountsChanged", onChange);
    eth?.on("chainChanged", onChange);
    return () => {
      eth?.removeListener("accountsChanged", onChange);
      eth?.removeListener("chainChanged", onChange);
    };
  }, [refresh]);

  const ensureChain = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    await switchChain(eth);
    await refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    await eth.request({ method: "eth_requestAccounts" });
    if (Number(await eth.request({ method: "eth_chainId" })) !== CHAIN_ID) await switchChain(eth);
    await refresh();
  }, [refresh]);

  /** Headers for issuer and admin API routes; verified by lib/server/wallet-auth.ts. */
  const signAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!state.provider) throw new Error("Wallet not connected");
    const signer = await state.provider.getSigner();
    const nonce = crypto.randomUUID();
    const issued = new Date().toISOString();
    const signature = await signer.signMessage(buildAuthMessage(nonce, issued));
    return {
      [WALLET_ADDRESS_HEADER]: await signer.getAddress(),
      [WALLET_NONCE_HEADER]: nonce,
      [WALLET_ISSUED_HEADER]: issued,
      [WALLET_SIGNATURE_HEADER]: signature,
    };
  }, [state.provider]);

  return { ...state, connect, ensureChain, refresh, signAuthHeaders };
}

export type Wallet = ReturnType<typeof useWallet>;
