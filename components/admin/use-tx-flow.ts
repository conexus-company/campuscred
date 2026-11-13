"use client";

import type { ContractTransactionResponse } from "ethers";
import { useState } from "react";
import { mapContractError } from "@/lib/chain/write";
import type { Hex } from "@/lib/contract/config";
import { AdminApiError, adminErrorMessage } from "./admin-errors";

type Step = "idle" | "wallet" | "confirming" | "saving";

type Options = {
  /** Contract method name for the "Approve … in MetaMask" step text. */
  method: string;
  /** Runs after the tx is mined. Throw AdminApiError for a friendly message. */
  save?: (txHash: Hex) => Promise<void>;
};

/**
 * MetaMask tx, receipt, then an optional save, with step text for a role="status" line.
 * If the tx is mined but the save fails, the next run retries only the save: never a second tx.
 */
export function useTxFlow({ method, save }: Options) {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  async function run(send: () => Promise<ContractTransactionResponse>): Promise<boolean> {
    setError(null);
    try {
      let hash = txHash;
      if (!hash) {
        setStep("wallet");
        const tx = await send();
        setStep("confirming");
        const receipt = await tx.wait();
        if (receipt?.status !== 1) throw new Error("Transaction reverted");
        hash = tx.hash as Hex;
        setTxHash(hash);
      }
      if (save) {
        setStep("saving");
        await save(hash);
      }
      setTxHash(null);
      return true;
    } catch (e) {
      if (!(e instanceof AdminApiError)) console.error(e);
      setError(e instanceof AdminApiError ? e.message : mapContractError(e));
      return false;
    } finally {
      setStep("idle");
    }
  }

  const stepText = {
    idle: null,
    wallet: `Approve ${method} in MetaMask…`,
    confirming: "Waiting for BSC Testnet to mine the transaction…",
    saving: "Updating the issuer list…",
  }[step];

  return { busy: step !== "idle", stepText, error, pendingTx: txHash, run };
}

/** POST a mined issuer tx to the admin confirm route. */
export async function confirmIssuerTx(txHash: Hex, headers: Record<string, string>): Promise<void> {
  const res = await fetch("/api/admin/issuers/confirm", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ txHash }),
  });
  if (!res.ok) throw new AdminApiError(adminErrorMessage((await res.json().catch(() => null))?.error));
}
