"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { BrowserProvider } from "ethers";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getWriteContract, removeIssuer } from "@/lib/chain/write";
import { confirmIssuerTx, useTxFlow } from "./use-tx-flow";

type Props = {
  wallet: string;
  displayName: string;
  provider: BrowserProvider;
  authHeaders: () => Promise<Record<string, string>>;
  onRemoved: () => void;
};

/** Remove button and confirm dialog: MetaMask removeIssuer, receipt, then the admin confirm route. */
export function RemoveIssuerDialog({ wallet, displayName, provider, authHeaders, onRemoved }: Props) {
  const [open, setOpen] = useState(false);
  const flow = useTxFlow({ method: "removeIssuer", save: async (tx) => confirmIssuerTx(tx, await authHeaders()) });

  async function remove() {
    if (await flow.run(async () => removeIssuer(await getWriteContract(provider), wallet))) {
      setOpen(false);
      onRemoved();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !flow.busy && setOpen(next)}>
      <Dialog.Trigger
        render={<Button variant="ink-outline" size="pill-sm" aria-label={`Remove ${displayName}`} />}
      >
        Remove
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-cc-ink/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[min(480px,calc(100vw-32px))] -translate-1/2 flex-col gap-5 rounded-3xl bg-white p-8 text-cc-ink shadow-xl max-[560px]:p-6">
          <Dialog.Title className="font-disp m-0 text-[26px] leading-tight">Remove this issuer?</Dialog.Title>
          <Dialog.Description className="m-0 text-[15px] leading-relaxed text-cc-muted">
            They can no longer issue. Credentials they already issued stay valid.
          </Dialog.Description>
          <p className="m-0 text-[15px]">
            <span className="font-semibold">{displayName}</span>
            <span className="mt-1 block break-all font-mono text-[13px] text-cc-muted">{wallet}</span>
          </p>
          {flow.stepText && (
            <p role="status" className="m-0 text-[15px] font-semibold">
              {flow.stepText}
            </p>
          )}
          {flow.error && (
            <p role="alert" className="m-0 text-[15px] font-semibold text-[#991B1B]">
              {flow.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button variant="ink" size="pill-sm" disabled={flow.busy} onClick={() => void remove()}>
              {flow.error ? "Try again" : "Remove issuer"}
            </Button>
            <Dialog.Close render={<Button variant="ink-outline" size="pill-sm" disabled={flow.busy} />}>
              Cancel
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
