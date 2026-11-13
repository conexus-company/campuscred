"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusPill } from "@/components/brand/status-pill";
import { FIELD } from "@/components/issuer/student-search";
import { Button } from "@/components/ui/button";
import { addIssuer, getWriteContract } from "@/lib/chain/write";
import { useAuthHeaders } from "@/lib/wallet/use-auth-headers";
import { useWallet } from "@/lib/wallet/use-wallet";
import { validateIssuerInput } from "./issuer-input";
import { RemoveIssuerDialog } from "./remove-issuer-dialog";
import { confirmIssuerTx, useTxFlow } from "./use-tx-flow";

type Issuer = { wallet: string; displayName: string; active: boolean };
type Load = { kind: "loading" } | { kind: "error" } | { kind: "ok"; rows: Issuer[] };

const COLS = "grid grid-cols-[1.4fr_2.4fr_1fr_auto] items-center gap-4 px-7";
const ERROR_TEXT = "m-0 text-sm font-semibold text-[#991B1B]";

/** "Approved issuers" card on /admin: list from GET /api/issuers, add form, and remove per row. */
export function IssuersCard() {
  const { status, provider, signAuthHeaders } = useWallet(); // the layout's RoleGate has already checked admin
  const authHeaders = useAuthHeaders(signAuthHeaders);
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const add = useTxFlow({ method: "addIssuer", save: async (tx) => confirmIssuerTx(tx, await authHeaders()) });

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/issuers", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = (await res.json()) as Issuer[];
      rows.sort((a, b) => Number(b.active) - Number(a.active) || a.displayName.localeCompare(b.displayName));
      setLoad({ kind: "ok", rows });
    } catch {
      setLoad({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchRows); // same pattern as useWallet's first sync
  }, [fetchRows]);

  const activeWallets = load.kind === "ok" ? load.rows.filter((r) => r.active).map((r) => r.wallet) : [];
  const input = validateIssuerInput(wallet, name, activeWallets);
  const errors = input.ok ? {} : input.errors;
  // Show a field's error once something is typed; an empty form just keeps the button disabled.
  const walletError = wallet ? errors.wallet : undefined;
  const nameError = name ? errors.name : undefined;
  const locked = add.busy || !!add.pendingTx; // a mined add must be saved as sent, so freeze the fields

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider || (!input.ok && !add.pendingTx)) return;
    const ok = await add.run(async () => {
      if (!input.ok) throw new Error("Invalid input");
      return addIssuer(await getWriteContract(provider), input.wallet, input.name);
    });
    if (ok) {
      setWallet("");
      setName("");
      void fetchRows();
    }
  }

  const reload = () => {
    setLoad({ kind: "loading" });
    void fetchRows();
  };

  return (
    <section aria-labelledby="issuers-heading" className="overflow-hidden rounded-3xl border border-cc-line bg-white">
      <div className="flex flex-col gap-1 px-7 pt-6 pb-2">
        <h2 id="issuers-heading" className="font-disp m-0 text-[26px]">
          Approved issuers
        </h2>
        <p className="m-0 text-sm text-cc-muted">Wallets that can issue and revoke credentials. Active first.</p>
      </div>

      {load.kind === "loading" && <p className="px-7 py-8 text-cc-muted">Loading issuers…</p>}

      {load.kind === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-4 px-7 py-8">
          <p className="m-0">Could not load the issuer list.</p>
          <Button variant="ink" size="pill-sm" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      {load.kind === "ok" && load.rows.length === 0 && <p className="px-7 py-8 text-cc-muted">No issuers yet.</p>}

      {load.kind === "ok" && load.rows.length > 0 && (
        <div className="overflow-x-auto">
          <div role="table" aria-labelledby="issuers-heading" className="min-w-[680px]">
            <div role="row" className={`${COLS} border-b border-cc-line py-3 text-[13px] font-semibold text-cc-muted-2`}>
              <div role="columnheader">Display name</div>
              <div role="columnheader">Wallet</div>
              <div role="columnheader">Status</div>
              <div role="columnheader">
                <span className="sr-only">Actions</span>
              </div>
            </div>
            {load.rows.map((r) => (
              <div key={r.wallet} role="row" className={`${COLS} border-b border-cc-track py-4 text-[15px] last:border-b-0`}>
                <div role="cell" className="font-disp text-[17px] tracking-[-0.02em]">
                  {r.displayName}
                </div>
                <div role="cell" className="break-all font-mono text-[13px]">
                  {r.wallet}
                </div>
                <div role="cell">
                  {r.active ? <StatusPill status="active" /> : <StatusPill status="revoked" label="Removed" />}
                </div>
                <div role="cell" className="min-w-[104px]">
                  {r.active && provider && (
                    <RemoveIssuerDialog
                      wallet={r.wallet}
                      displayName={r.displayName}
                      provider={provider}
                      authHeaders={authHeaders}
                      onRemoved={() => void fetchRows()}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4 border-t border-cc-line px-7 py-6">
        <h3 className="font-disp m-0 text-[20px]">Add issuer</h3>
        <div className="flex flex-col gap-2">
          <label htmlFor="issuer-wallet" className="text-sm font-semibold">
            Wallet address
          </label>
          <input
            id="issuer-wallet"
            className={`${FIELD} font-mono`}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
            value={wallet}
            disabled={locked}
            aria-invalid={!!walletError}
            aria-describedby={walletError ? "issuer-wallet-error" : undefined}
            onChange={(e) => setWallet(e.currentTarget.value)}
          />
          {walletError && (
            <p id="issuer-wallet-error" className={ERROR_TEXT}>
              {walletError}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="issuer-name" className="text-sm font-semibold">
            Display name
          </label>
          <input
            id="issuer-name"
            className={FIELD}
            placeholder="Registrar's office"
            value={name}
            disabled={locked}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "issuer-name-error" : undefined}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          {nameError && (
            <p id="issuer-name-error" className={ERROR_TEXT}>
              {nameError}
            </p>
          )}
        </div>
        {add.stepText && (
          <p role="status" className="m-0 text-[15px] font-semibold">
            {add.stepText}
          </p>
        )}
        {add.error && (
          <p role="alert" className="m-0 text-[15px] font-semibold text-[#991B1B]">
            {add.error}
          </p>
        )}
        <div>
          <Button
            type="submit"
            variant="ink"
            size="pill"
            disabled={add.busy || status !== "ready" || (!input.ok && !add.pendingTx)}
          >
            {add.error ? "Try again" : "Add issuer"}
          </Button>
        </div>
      </form>
    </section>
  );
}
