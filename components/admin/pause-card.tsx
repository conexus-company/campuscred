"use client";

import { CircleCheck, CirclePause } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getWriteContract, pause, readPaused, unpause } from "@/lib/chain/write";
import { useWallet } from "@/lib/wallet/use-wallet";
import { useTxFlow } from "./use-tx-flow";

type Load = { kind: "loading" } | { kind: "error" } | { kind: "ok"; paused: boolean };

/** "Emergency pause" card on /admin. Reads paused() from the chain; no database copy. */
export function PauseCard() {
  const { provider } = useWallet(); // the layout's RoleGate has already checked admin
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const paused = load.kind === "ok" && load.paused;
  // Reading paused() first means the switch only offers the valid action, so EnforcedPause/ExpectedPause never show here.
  const flow = useTxFlow({ method: paused ? "unpause" : "pause" });

  const read = useCallback(async () => {
    if (!provider) return;
    try {
      setLoad({ kind: "ok", paused: await readPaused(provider) });
    } catch {
      setLoad({ kind: "error" });
    }
  }, [provider]);

  useEffect(() => {
    void Promise.resolve().then(read);
  }, [read]);

  async function toggle() {
    if (!provider || load.kind !== "ok") return;
    await flow.run(async () => {
      const c = await getWriteContract(provider);
      return paused ? unpause(c) : pause(c);
    });
    await read(); // after success or failure: the chain may have changed either way
  }

  const Icon = paused ? CirclePause : CircleCheck;

  return (
    <section aria-labelledby="pause-heading" className="flex flex-col gap-4 rounded-3xl border border-cc-line bg-white px-7 py-6">
      <h2 id="pause-heading" className="font-disp m-0 text-[26px]">
        Emergency pause
      </h2>
      <p className="m-0 text-[15px] leading-relaxed text-cc-muted">
        Pausing stops new issuing and revoking. Verification keeps working.
      </p>

      {load.kind === "loading" && <p className="m-0 text-cc-muted">Reading the contract…</p>}

      {load.kind === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-4">
          <p className="m-0">Could not read the pause state from BSC Testnet.</p>
          <Button
            variant="ink"
            size="pill-sm"
            onClick={() => {
              setLoad({ kind: "loading" });
              void read();
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {load.kind === "ok" && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 flex items-center gap-2.5 text-[15px] font-semibold">
            <Icon aria-hidden="true" className={paused ? "text-cc-revoked" : "text-cc-valid"} />
            {paused ? "Paused: new issuing and revoking are stopped" : "Issuing and revoking are running"}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={paused}
            aria-label="Pause issuing and revoking"
            disabled={flow.busy}
            onClick={() => void toggle()}
            className="group inline-flex min-h-11 min-w-11 items-center gap-3 rounded-full px-1 text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-cc-ink disabled:opacity-60"
          >
            <span
              aria-hidden="true"
              className={`relative inline-block h-7 w-12 rounded-full motion-safe:transition-colors ${paused ? "bg-cc-ink" : "bg-cc-track"}`}
            >
              <span
                className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow motion-safe:transition-transform ${paused ? "translate-x-5" : ""}`}
              />
            </span>
            {paused ? "On" : "Off"}
          </button>
        </div>
      )}

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
    </section>
  );
}
