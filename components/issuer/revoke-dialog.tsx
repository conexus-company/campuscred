"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { BrowserProvider } from "ethers";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getWriteContract, mapContractError, revokeCredential } from "@/lib/chain/write";
import { REVOKE_REASONS, REVOKE_REASON_LABELS, type RevokeReason } from "@/lib/contract/codes";
import type { Hex } from "@/lib/contract/config";
import { IssueApiError, apiErrorMessage } from "./issue-errors";
import { FIELD } from "./student-search";

type Step = "form" | "wallet" | "confirming" | "saving";
const STEP_TEXT: Record<Exclude<Step, "form">, string> = {
  wallet: "Approve revokeCredential in MetaMask…",
  confirming: "Waiting for BSC Testnet to mine the transaction…",
  saving: "Recording the revocation…",
};

type RevokeDialogProps = {
  docHash: Hex;
  provider: BrowserProvider;
  authHeaders: () => Promise<Record<string, string>>;
  onRevoked: () => void;
};

/** Revoke button and confirm dialog: MetaMask revokeCredential, receipt, then revoke-confirm. */
export function RevokeDialog({ docHash, provider, authHeaders, onRevoked }: RevokeDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RevokeReason | "">("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const busy = step !== "form";

  async function record(tx: Hex) {
    setStep("saving");
    const res = await fetch(`/api/credentials/${docHash}/revoke-confirm`, {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: tx }),
    });
    if (!res.ok) throw new IssueApiError(apiErrorMessage((await res.json().catch(() => null))?.error));
    setOpen(false);
    onRevoked();
  }

  async function run() {
    if (!reason) return;
    setError(null);
    try {
      // The revoke is already mined: only the database record is missing. Never send a second tx.
      if (txHash) return await record(txHash);
      setStep("wallet");
      const tx = await revokeCredential(await getWriteContract(provider), docHash, reason);
      setStep("confirming");
      const receipt = await tx.wait();
      if (receipt?.status !== 1) throw new Error("Transaction reverted");
      setTxHash(tx.hash as Hex);
      await record(tx.hash as Hex);
    } catch (e) {
      if (!(e instanceof IssueApiError)) console.error(e);
      setError(e instanceof IssueApiError ? e.message : mapContractError(e));
    } finally {
      setStep("form");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <Dialog.Trigger render={<Button variant="yellow" size="pill" />}>Revoke</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-cc-ink/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[min(480px,calc(100vw-32px))] -translate-1/2 flex-col gap-5 rounded-3xl bg-white p-8 text-cc-ink shadow-xl max-[560px]:p-6">
          <Dialog.Title className="font-disp m-0 text-[26px] leading-tight">Revoke this credential?</Dialog.Title>
          <Dialog.Description className="m-0 text-[15px] leading-relaxed text-cc-muted">
            This cannot be undone. Verifiers will see it as revoked at once.
          </Dialog.Description>
          <div className="flex flex-col gap-2.5">
            <label htmlFor="revoke-reason" className="text-sm font-semibold">
              Reason
            </label>
            <select
              id="revoke-reason"
              className={FIELD}
              disabled={busy || !!txHash}
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value as RevokeReason)}
            >
              <option value="" disabled>
                Choose a reason
              </option>
              {REVOKE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REVOKE_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          {busy && (
            <p role="status" className="m-0 text-[15px] font-semibold">
              {STEP_TEXT[step]}
            </p>
          )}
          {error && (
            <p role="alert" className="m-0 text-[15px] font-semibold text-[#991B1B]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button variant="ink" size="pill-sm" disabled={!reason || busy} onClick={() => void run()}>
              {error ? "Try again" : "Revoke"}
            </Button>
            <Dialog.Close render={<Button variant="ink-outline" size="pill-sm" disabled={busy} />}>Cancel</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
