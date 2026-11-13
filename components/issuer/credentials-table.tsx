"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusPill } from "@/components/brand/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { TabsPill, type TabsPillOption } from "@/components/ui/tabs-pill";
import { credTypeLabel, formatDate, shortHash } from "@/lib/format";
import type { IssuerCredential } from "@/lib/server/issuer-credentials";
import { useWallet } from "@/lib/wallet/use-wallet";

type Filter = "all" | "active" | "revoked";
const FILTERS: TabsPillOption<Filter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
];
const COLS = "grid grid-cols-[2.2fr_1.4fr_1fr_1fr_1.2fr] gap-4 px-7";

type Load = { kind: "loading" } | { kind: "error" } | { kind: "ok"; rows: IssuerCredential[] };

/** Credentials table on /issuer (prototype Issuer.dc.html). Rendered inside the layout's RoleGate. */
export function CredentialsTable() {
  const { status, signAuthHeaders } = useWallet();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [filter, setFilter] = useState<Filter>("all");

  const fetchRows = useCallback(async () => {
    try {
      // shortcut: signs a fresh auth message per page load (one MetaMask prompt); cache headers for <5 min if prompts annoy.
      const res = await fetch("/api/issuer/credentials", { headers: await signAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLoad({ kind: "ok", rows: (await res.json()) as IssuerCredential[] });
    } catch {
      setLoad({ kind: "error" }); // includes a rejected signature
    }
  }, [signAuthHeaders]);

  useEffect(() => {
    if (status === "ready") void Promise.resolve().then(fetchRows); // same pattern as useWallet's first sync
  }, [status, fetchRows]);

  const rows = load.kind === "ok" ? load.rows.filter((r) => filter === "all" || r.status === filter) : [];

  return (
    <>
      <TabsPill options={FILTERS} value={filter} onChange={setFilter} label="Filter by status" />

      <section aria-labelledby="credentials-heading" className="overflow-hidden rounded-3xl border border-cc-line bg-white">
        <div className="flex flex-col gap-1 px-7 pt-6 pb-2">
          <h2 id="credentials-heading" className="font-disp m-0 text-[26px]">
            Credentials
          </h2>
          <p className="m-0 text-sm text-cc-muted">Newest first.</p>
        </div>

        {load.kind === "loading" && <p className="px-7 py-8 text-cc-muted">Loading credentials…</p>}

        {load.kind === "error" && (
          <div role="alert" className="flex flex-wrap items-center gap-4 px-7 py-8">
            <p className="m-0">Could not load credentials. Sign the message in MetaMask, then try again.</p>
            <button
              type="button"
              className={buttonVariants({ variant: "ink", size: "pill-sm" })}
              onClick={() => {
                setLoad({ kind: "loading" });
                void fetchRows();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {load.kind === "ok" && rows.length === 0 && (
          <div className="flex flex-wrap items-center gap-4 px-7 py-8">
            <p className="m-0 text-cc-muted">
              {load.rows.length === 0 ? "No credentials issued yet." : `No ${filter} credentials.`}
            </p>
            {load.rows.length === 0 && (
              <Link href="/issuer/new" className={buttonVariants({ variant: "ink", size: "pill-sm" })}>
                Issue new
              </Link>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <div role="table" aria-labelledby="credentials-heading" className="min-w-[760px]">
              <div role="row" className={`${COLS} border-b border-cc-line py-3 text-[13px] font-semibold text-cc-muted-2`}>
                <div role="columnheader">Credential</div>
                <div role="columnheader">Student</div>
                <div role="columnheader">Issued</div>
                <div role="columnheader">Status</div>
                <div role="columnheader">Transaction</div>
              </div>
              {rows.map((r) => (
                <div
                  key={r.docHash}
                  role="row"
                  className={`${COLS} items-center border-b border-cc-track py-[18px] text-[15px] transition-colors last:border-b-0 hover:bg-cc-butter`}
                >
                  <div role="cell">
                    <Link href={`/issuer/credential/${r.docHash}`} className="flex min-h-11 flex-col justify-center gap-0.5">
                      <span className="font-disp text-[17px] tracking-[-0.02em]">{credTypeLabel(r.credType)}</span>
                      <span className="text-[13px] text-cc-muted">{r.title}</span>
                    </Link>
                  </div>
                  <div role="cell">
                    {r.studentName ?? "Unknown student"}
                    <div className="text-[13px] text-cc-muted">{r.studentNo}</div>
                  </div>
                  <div role="cell">{formatDate(r.issuedAt)}</div>
                  <div role="cell">
                    <StatusPill status={r.status} />
                  </div>
                  <div role="cell">
                    <a
                      href={r.txUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Transaction ${shortHash(r.issueTx)} on BscScan (opens in a new tab)`}
                      className="flex min-h-11 items-center font-mono text-[13px] underline decoration-cc-yellow decoration-2 underline-offset-[5px]"
                    >
                      {shortHash(r.issueTx)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
