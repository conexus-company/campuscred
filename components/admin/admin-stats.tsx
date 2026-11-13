"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet/use-wallet";

type Stats = { issued: number; verified: number; revoked: number };
type Load = { kind: "loading" } | { kind: "error" } | { kind: "ok"; stats: Stats };

const CARDS: { key: keyof Stats; label: string }[] = [
  { key: "issued", label: "Credentials issued" },
  { key: "verified", label: "Verifications" },
  { key: "revoked", label: "Revoked" },
];

/** Admin counts on /admin (FR-13). Rendered inside the admin RoleGate. */
export function AdminStats() {
  const { status, signAuthHeaders } = useWallet();
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: await signAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLoad({ kind: "ok", stats: (await res.json()) as Stats });
    } catch {
      setLoad({ kind: "error" }); // includes a rejected signature
    }
  }, [signAuthHeaders]);

  useEffect(() => {
    if (status === "ready") void Promise.resolve().then(fetchStats); // same pattern as CredentialsTable
  }, [status, fetchStats]);

  if (load.kind === "error") {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 rounded-3xl border border-cc-line bg-white px-7 py-6">
        <p className="m-0">Could not load the counts. Sign the message in MetaMask, then try again.</p>
        <button
          type="button"
          className={buttonVariants({ variant: "ink", size: "pill-sm" })}
          onClick={() => {
            setLoad({ kind: "loading" });
            void fetchStats();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Totals" aria-busy={load.kind === "loading"} className="flex flex-wrap gap-4">
      {CARDS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-[1_1_200px] flex-col gap-2 rounded-3xl border border-cc-line bg-white px-7 py-6"
        >
          <p className="m-0 text-sm text-cc-muted">{label}</p>
          <p className="font-disp m-0 text-[44px] leading-none">{load.kind === "ok" ? load.stats[key] : "…"}</p>
        </div>
      ))}
    </section>
  );
}
