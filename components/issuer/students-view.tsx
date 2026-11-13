"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/brand/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { credTypeLabel, formatDate } from "@/lib/format";
import type { IssuerCredential } from "@/lib/server/issuer-credentials";
import { cn } from "@/lib/utils";
import { useAuthHeaders } from "@/lib/wallet/use-auth-headers";
import { useWallet } from "@/lib/wallet/use-wallet";
import { groupByStudent } from "./group-by-student";
import { RevokeDialog } from "./revoke-dialog";

type Load = { kind: "loading" } | { kind: "error" } | { kind: "ok"; rows: IssuerCredential[] };

const PANEL = "rounded-3xl border border-cc-line bg-white";

/** /issuer/students: students with credentials, and the selected student's credentials with Revoke. */
export function StudentsView() {
  const { status, address, isAdmin, isIssuer, provider, signAuthHeaders } = useWallet();
  const authHeaders = useAuthHeaders(signAuthHeaders);
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [filter, setFilter] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const selected = useSearchParams().get("student");

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/issuer/credentials", { headers: await authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLoad({ kind: "ok", rows: (await res.json()) as IssuerCredential[] });
    } catch {
      setLoad({ kind: "error" }); // includes a rejected signature
    }
  }, [authHeaders]);

  useEffect(() => {
    if (status === "ready") void Promise.resolve().then(fetchRows); // same pattern as CredentialsTable
  }, [status, fetchRows]);

  const groups = useMemo(() => (load.kind === "ok" ? groupByStudent(load.rows) : []), [load]);
  const q = filter.trim().toLowerCase();
  const shown = q
    ? groups.filter((g) => g.studentName.toLowerCase().includes(q) || g.studentNo.toLowerCase().includes(q))
    : groups;
  const current = groups.find((g) => g.studentNo === selected) ?? null;

  const select = (studentNo: string) =>
    router.replace(`${pathname}?student=${encodeURIComponent(studentNo)}`, { scroll: false });

  if (load.kind === "loading") return <p className="m-0 text-cc-muted">Loading students…</p>;

  if (load.kind === "error") {
    return (
      <div role="alert" className={`${PANEL} flex flex-wrap items-center gap-4 px-7 py-6`}>
        <p className="m-0">Could not load students. Sign the message in MetaMask, then try again.</p>
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
    );
  }

  if (groups.length === 0) {
    return (
      <div className={`${PANEL} flex flex-wrap items-center gap-4 px-7 py-6`}>
        <p className="m-0 text-cc-muted">No credentials issued yet, so no students to show.</p>
        <Link href="/issuer/new" className={buttonVariants({ variant: "ink", size: "pill-sm" })}>
          Issue new
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section aria-labelledby="students-heading" className={`${PANEL} flex flex-[1_1_280px] flex-col gap-3 px-5 py-5`}>
        <h2 id="students-heading" className="font-disp m-0 px-2 text-[22px]">
          Students
        </h2>
        <label className="flex flex-col gap-1 px-2 text-sm text-cc-muted">
          Filter by name or student number
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-h-11 rounded-xl border border-cc-line px-3 text-[15px] text-cc-ink"
          />
        </label>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {shown.map((g) => (
            <li key={g.studentNo}>
              <button
                type="button"
                aria-pressed={g.studentNo === selected}
                onClick={() => select(g.studentNo)}
                className={cn(
                  "flex min-h-11 w-full flex-col items-start gap-0.5 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-cc-butter",
                  g.studentNo === selected && "bg-cc-butter",
                )}
              >
                <span className="font-semibold">{g.studentName}</span>
                <span className="text-[13px] text-cc-muted">
                  {g.studentNo || "No student number"} · {g.credentials.length} credential
                  {g.credentials.length === 1 ? "" : "s"}
                  {g.revoked > 0 && ` · ${g.revoked} revoked`}
                </span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-3 py-2 text-cc-muted">No students match.</li>}
        </ul>
      </section>

      <section
        aria-labelledby="student-credentials-heading"
        aria-live="polite"
        className={`${PANEL} flex flex-[2_1_420px] flex-col gap-3 px-7 py-6`}
      >
        {!current ? (
          <p id="student-credentials-heading" className="m-0 text-cc-muted">
            Choose a student to see their credentials.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <h2 id="student-credentials-heading" className="font-disp m-0 text-[24px]">
                {current.studentName}
              </h2>
              <p className="m-0 text-sm text-cc-muted">
                {current.studentNo || "No student number"} · {current.active} active · {current.revoked} revoked
              </p>
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {current.credentials.map((c) => {
                const ownWallet = !!address && c.issuerWallet.toLowerCase() === address.toLowerCase();
                const canRevoke = c.status === "active" && !!provider && (isAdmin || (isIssuer && ownWallet));
                return (
                  <li
                    key={c.docHash}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-cc-track py-4 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-disp text-[17px] tracking-[-0.02em]">{credTypeLabel(c.credType)}</span>
                      <span className="text-[13px] text-cc-muted">
                        {c.title} · Issued {formatDate(c.issuedAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <StatusPill status={c.status} />
                      <Link
                        href={`/issuer/credential/${c.docHash}`}
                        className={buttonVariants({ variant: "ghost", size: "pill-sm" })}
                      >
                        Details
                      </Link>
                      {canRevoke && provider && (
                        <RevokeDialog
                          docHash={c.docHash}
                          provider={provider}
                          authHeaders={authHeaders}
                          onRevoked={() => void fetchRows()}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
