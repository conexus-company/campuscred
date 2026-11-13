"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { HashText } from "@/components/brand/hash-text";
import { StatusPill } from "@/components/brand/status-pill";
import { PageBanner } from "@/components/shell/page-banner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { txUrl } from "@/lib/contract/config";
import { credTypeLabel, formatDate, revokeReasonText, shortAddress, shortHash } from "@/lib/format";
import type { IssuerCredential } from "@/lib/server/issuer-credentials";
import { useAuthHeaders } from "@/lib/wallet/use-auth-headers";
import { useWallet } from "@/lib/wallet/use-wallet";
import { RevokeDialog } from "./revoke-dialog";

type Load = { kind: "loading" } | { kind: "error" } | { kind: "missing" } | { kind: "ok"; c: IssuerCredential };

const LINK = "font-mono text-[13px] break-all underline decoration-cc-yellow decoration-2 underline-offset-[5px]";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-cc-track py-3 last:border-b-0 max-[560px]:grid-cols-1 max-[560px]:gap-1">
      <dt className="text-sm font-semibold text-cc-muted-2">{label}</dt>
      <dd className="m-0 min-w-0">{children}</dd>
    </div>
  );
}

/** /issuer/credential/[hash]: detail, history and Revoke. Rendered inside the layout's RoleGate. */
export function CredentialDetail() {
  const { hash } = useParams<{ hash: string }>();
  const { status, address, isAdmin, isIssuer, provider, signAuthHeaders } = useWallet();
  const authHeaders = useAuthHeaders(signAuthHeaders);
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  const fetchOne = useCallback(async () => {
    try {
      const res = await fetch(`/api/issuer/credentials/${encodeURIComponent(hash)}`, { headers: await authHeaders() });
      if (res.status === 404) return setLoad({ kind: "missing" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLoad({ kind: "ok", c: (await res.json()) as IssuerCredential });
    } catch {
      setLoad({ kind: "error" }); // includes a rejected signature
    }
  }, [hash, authHeaders]);

  useEffect(() => {
    if (status === "ready") void Promise.resolve().then(fetchOne); // same pattern as CredentialsTable
  }, [status, fetchOne]);

  if (load.kind !== "ok") {
    return (
      <>
        <PageBanner title="Credential" />
        <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-cc-line bg-white px-7 py-8">
          {load.kind === "loading" && <p className="m-0 text-cc-muted">Loading credential…</p>}
          {load.kind === "missing" && (
            <p className="m-0">No credential with this fingerprint, or it was issued by another wallet.</p>
          )}
          {load.kind === "error" && (
            <div role="alert" className="contents">
              <p className="m-0">Could not load the credential. Sign the message in MetaMask, then try again.</p>
              <button
                type="button"
                className={buttonVariants({ variant: "ink", size: "pill-sm" })}
                onClick={() => {
                  setLoad({ kind: "loading" });
                  void fetchOne();
                }}
              >
                Retry
              </button>
            </div>
          )}
        </section>
      </>
    );
  }

  const c = load.c;
  const ownWallet = !!address && c.issuerWallet.toLowerCase() === address.toLowerCase();
  const canRevoke = c.status === "active" && !!provider && (isAdmin || (isIssuer && ownWallet));
  const history: TimelineItem[] = [
    { title: "Issued", date: formatDate(c.issuedAt), text: "Recorded on BSC Testnet.", tone: "valid" },
  ];
  if (c.status === "revoked") {
    history.unshift({
      title: "Revoked",
      date: c.revokedAt ? formatDate(c.revokedAt) : undefined,
      text: `Reason: ${revokeReasonText(c.revokeReason)}.`,
      tone: "revoked",
    });
  }

  return (
    <>
      <PageBanner
        title={credTypeLabel(c.credType)}
        subtitle={c.title}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={c.status} size="md" />
            {canRevoke && (
              <RevokeDialog
                docHash={c.docHash}
                provider={provider}
                authHeaders={authHeaders}
                onRevoked={() => void fetchOne()}
              />
            )}
          </div>
        }
      />
      <div className="flex flex-wrap items-start gap-5">
        <Card className="min-w-0 flex-[1_1_520px] rounded-3xl">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="m-0">
              <Row label="Student">
                {c.studentName ?? "Unknown student"}
                {c.studentNo && <span className="text-cc-muted"> · {c.studentNo}</span>}
              </Row>
              <Row label="Type">{credTypeLabel(c.credType)}</Row>
              <Row label="Issued">{formatDate(c.issuedAt)}</Row>
              <Row label="Issuer">
                {c.issuerName} <span className="font-mono text-[13px] text-cc-muted">{shortAddress(c.issuerWallet)}</span>
              </Row>
              <Row label="Fingerprint">
                <HashText value={c.docHash} className="text-sm leading-[1.7]" />
              </Row>
              <Row label="Share link">
                <a href={`/v/${c.slug}`} className={LINK}>
                  /v/{c.slug}
                </a>
              </Row>
              <Row label="Transaction">
                <a href={c.txUrl} target="_blank" rel="noreferrer" className={LINK}>
                  {shortHash(c.issueTx)}
                  <span className="sr-only"> on BscScan (opens in a new tab)</span>
                </a>
                {c.revokeTx && (
                  <>
                    {" · revoked in "}
                    <a href={txUrl(c.revokeTx)} target="_blank" rel="noreferrer" className={LINK}>
                      {shortHash(c.revokeTx)}
                      <span className="sr-only"> on BscScan (opens in a new tab)</span>
                    </a>
                  </>
                )}
              </Row>
            </dl>
          </CardContent>
        </Card>
        <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-3xl border border-cc-line bg-white px-7 py-6">
          <h2 className="font-disp m-0 text-[22px]">History</h2>
          <Timeline items={history} />
        </section>
      </div>
    </>
  );
}
