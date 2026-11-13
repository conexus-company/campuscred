"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { HashText } from "@/components/brand/hash-text";
import { STATUS_ON_DARK, StatusPill } from "@/components/brand/status-pill";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/ui/drop-zone";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { readChainRecord } from "@/lib/chain/read";
import { credTypeLabel, formatDate, revokeReasonText } from "@/lib/format";
import { sha256Hex } from "@/lib/hash";
import type { ChainRecord, Hex, VerifyResultKind } from "@/lib/types/credential";
import { decideResult } from "@/lib/verify/decide-result";
import { logVerification } from "@/lib/verify/log";
import type { SlugMeta } from "@/lib/verify/slug-meta";
import { ContractLink } from "./trust-strip";

type Chain = { phase: "loading" } | { phase: "error" } | { phase: "ready"; record: ChainRecord };

type Copy =
  | { phase: "idle" }
  | { phase: "hashing"; fileName: string }
  | { phase: "error"; fileName: string }
  | { phase: "done"; fileName: string; hash: Hex; result: VerifyResultKind };

const linkClass =
  "flex min-h-8 items-center text-[15px] font-semibold text-cc-ink underline decoration-cc-yellow decoration-2 underline-offset-[5px]";

/**
 * /v/[slug] client side: reads the chain for the slug's hash on load, then lets
 * the verifier compare a PDF they were given (rule 3.7.1, openedViaSlug).
 */
export function SlugVerify({ meta }: { meta: SlugMeta }) {
  const [chain, setChain] = useState<Chain>({ phase: "loading" });
  const [copy, setCopy] = useState<Copy>({ phase: "idle" });
  const run = useRef(0);

  const load = useCallback(async () => {
    const started = performance.now();
    setChain({ phase: "loading" });
    try {
      const record = await readChainRecord(meta.docHash);
      if (process.env.NODE_ENV !== "production") {
        console.info(`[verify] ${record.status} in ${Math.round(performance.now() - started)} ms`);
      }
      setChain({ phase: "ready", record });
    } catch {
      setChain({ phase: "error" });
    }
  }, [meta.docHash]);

  useEffect(() => {
    // Read the chain once on mount; load() only sets state after its await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Log the link result once it is known. QR codes carry ?via=qr (components/student/share-sheet.tsx).
  useEffect(() => {
    if (chain.phase !== "ready") return;
    const via = new URLSearchParams(window.location.search).get("via") === "qr" ? "qr" : "link";
    const result = decideResult({ record: chain.record, openedViaSlug: true, slugDocHash: meta.docHash });
    logVerification({ docHash: meta.docHash, result, method: via });
  }, [chain, meta.docHash]);

  if (chain.phase === "loading") {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-[32px] bg-cc-side px-10 py-11 text-cc-on-dark max-[560px]:px-6 max-[560px]:py-8">
        <p className="font-disp m-0 text-[34px] max-[560px]:text-[28px]">Reading BNB Smart Chain…</p>
        <p className="m-0 text-base text-cc-on-dark-muted">{meta.title}</p>
        <div className="h-2 overflow-hidden rounded bg-white/10">
          <div className="cc-fill h-2 bg-cc-yellow" />
        </div>
      </div>
    );
  }

  if (chain.phase === "error") {
    return (
      <div className="cc-in flex flex-col gap-4 rounded-[28px] border border-cc-line bg-white px-10 py-11 max-[560px]:px-5 max-[560px]:py-8">
        <h1 className="font-disp m-0 text-[34px] max-[560px]:text-[28px]">Couldn’t reach BNB Smart Chain</h1>
        <p className="m-0 text-base text-cc-muted">This credential was not checked. Check your connection and try again.</p>
        <div className="pt-2">
          <Button variant="ink" size="pill-lg" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const record = chain.record;
  const status = decideResult({ record, openedViaSlug: true, slugDocHash: meta.docHash });

  async function compare(file: File) {
    const id = ++run.current;
    setCopy({ phase: "hashing", fileName: file.name });
    try {
      const hash = await sha256Hex(file);
      if (id !== run.current) return;
      const result = decideResult({ record, openedViaSlug: true, slugDocHash: meta.docHash, uploadedDocHash: hash });
      setCopy({ phase: "done", fileName: file.name, hash, result });
      logVerification({ docHash: meta.docHash, result, method: "upload" });
    } catch {
      if (id === run.current) setCopy({ phase: "error", fileName: file.name });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <TitleBlock meta={meta} record={record} status={status} />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-6 max-[960px]:grid-cols-1">
        <div className="flex flex-col gap-6">
          <Panel title="Status history">
            <Timeline items={history(meta, record, status)} />
          </Panel>
          <Panel title="Got a copy of this document?">
            <p className="m-0 text-[15px] leading-[1.55] text-cc-muted">
              Drop the PDF you were given. It is fingerprinted on this device and compared with the one that was
              issued. The file is never uploaded.
            </p>
            <DropZone size="compact" title="Drop the PDF here" onFile={compare} />
            <div aria-live="polite">
              <CopyResult copy={copy} issuedHash={meta.docHash} record={record} />
            </div>
          </Panel>
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Where this stands">
            <p className="m-0 text-base leading-[1.6]">{standing(status, record)}</p>
          </Panel>
          <Panel title="On the chain">
            <Field label="Fingerprint (SHA-256)">
              <HashText value={meta.docHash} className="text-sm leading-[1.7]" />
            </Field>
            {status !== "not_found" && (
              <Field label="Student reference (salted)">
                <HashText value={record.studentRef} className="text-sm leading-[1.7]" />
              </Field>
            )}
            <p className="m-0 rounded-2xl bg-cc-butter px-4 py-3 text-sm leading-[1.55]">
              No name, student number or email is stored on the chain.
            </p>
            <div className="flex flex-col gap-1">
              <a href={meta.txUrl} target="_blank" rel="noreferrer" className={linkClass}>
                Issue transaction on BscScan
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <ContractLink suffix=" on BscScan" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function TitleBlock({ meta, record, status }: { meta: SlugMeta; record: ChainRecord; status: VerifyResultKind }) {
  const issued = record.issuedAt ?? meta.issuedAt;
  return (
    <div className="cc-in cc-on-dark flex flex-col gap-[22px] rounded-[32px] bg-cc-side px-10 py-11 text-white max-[560px]:px-6 max-[560px]:py-8">
      <StatusPill status={status} size="md" className="self-start" />
      <h1 className="font-disp m-0 max-w-[900px] text-[clamp(36px,5vw,68px)] leading-[1.02]">{meta.title}</h1>
      {status === "not_found" ? (
        <p className="m-0 max-w-[640px] text-xl leading-normal text-[#F0E8C8]">
          BNB Smart Chain has no record of this credential, so it can’t be trusted.
        </p>
      ) : (
        <p className="m-0 max-w-[640px] text-xl leading-normal" style={{ color: STATUS_ON_DARK[status] }}>
          {status === "revoked"
            ? `Revoked on ${record.revokedAt ? formatDate(record.revokedAt) : "an unknown date"}. Reason: ${revokeReasonText(record.revokeReason)}.`
            : "Valid. Recorded on BNB Smart Chain and not revoked."}
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3">
        <Tile label="Issuer" value={meta.issuerName} />
        <Tile label="Type" value={credTypeLabel(meta.credType)} />
        <Tile label="Issued" value={formatDate(issued)} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/8 px-[18px] py-3.5">
      <div className="text-[13px] font-semibold text-cc-on-dark-muted">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-cc-line bg-white px-7 py-6 max-[560px]:px-5">
      <h2 className="font-disp m-0 text-[22px] leading-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[13px] font-semibold text-cc-muted-2">{label}</div>
      {children}
    </div>
  );
}

/** Newest first: Revoked on top when revoked, then Issued. */
function history(meta: SlugMeta, record: ChainRecord, status: VerifyResultKind): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (status === "revoked") {
    items.push({
      title: "Revoked",
      date: record.revokedAt ? formatDate(record.revokedAt) : undefined,
      text: `Reason: ${revokeReasonText(record.revokeReason)}.`,
      tone: "revoked",
    });
  }
  items.push({
    title: "Issued",
    date: formatDate(record.issuedAt ?? meta.issuedAt),
    text: `By ${meta.issuerName}.`,
    tone: status === "valid" ? "valid" : "neutral",
  });
  return items;
}

function standing(status: VerifyResultKind, record: ChainRecord): string {
  switch (status) {
    case "valid":
      return "This credential is valid. The issuer recorded it on BNB Smart Chain and has not revoked it.";
    case "revoked":
      return `The issuer revoked this credential on ${record.revokedAt ? formatDate(record.revokedAt) : "an unknown date"}. Do not accept it.`;
    default:
      return "There is no record of this credential on BNB Smart Chain. Do not accept it.";
  }
}

function CopyResult({ copy, issuedHash, record }: { copy: Copy; issuedHash: Hex; record: ChainRecord }) {
  if (copy.phase === "idle") return null;

  if (copy.phase === "hashing") {
    return <p className="m-0 text-[15px] text-cc-muted">Computing the fingerprint of {copy.fileName}…</p>;
  }

  if (copy.phase === "error") {
    return (
      <p className="m-0 text-[15px] font-semibold text-[#991B1B]">
        Couldn’t read {copy.fileName}. Choose the PDF again, or try another copy.
      </p>
    );
  }

  if (copy.result === "tampered") {
    return (
      <div className="flex flex-col gap-3 rounded-[20px] border-2 border-cc-tampered bg-[#FEF2F2] px-6 py-5">
        <StatusPill status="tampered" className="self-start" />
        <p className="m-0 text-base leading-[1.55] font-semibold">
          This file does not match the issued credential. It was changed after it was issued, or it is a different
          document.
        </p>
        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
          <dt className="text-cc-muted-2">Issued</dt>
          <dd className="m-0">
            <HashText value={issuedHash} short />
          </dd>
          <dt className="text-cc-muted-2">This file</dt>
          <dd className="m-0">
            <HashText value={copy.hash} short highlight="red" />
          </dd>
        </dl>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[20px] border-2 border-cc-valid bg-[#F0FDF4] px-6 py-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status="match" />
        <span className="text-[15px] font-semibold break-all">{copy.fileName}</span>
      </div>
      <p className="m-0 text-[15px] leading-[1.55]">
        {copy.result === "revoked"
          ? `This file is the one that was issued, but the credential was revoked on ${record.revokedAt ? formatDate(record.revokedAt) : "an unknown date"}.`
          : copy.result === "valid"
            ? "This file is exactly the one that was issued. Nothing in it was changed."
            : "This file is the one linked here, but BNB Smart Chain has no record of it."}
      </p>
    </div>
  );
}
