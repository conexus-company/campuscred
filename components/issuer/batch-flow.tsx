"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { chunk, matchBatch, parseBatchCsv, type BatchRow } from "@/lib/batch";
import { getWriteContract, issueBatch, mapContractError } from "@/lib/chain/write";
import { CRED_TYPES, type CredType } from "@/lib/contract/codes";
import type { Hex } from "@/lib/contract/config";
import { CRED_TYPE_LABELS } from "@/lib/format";
import { sha256Hex } from "@/lib/hash";
import { useAuthHeaders } from "@/lib/wallet/use-auth-headers";
import { useWallet } from "@/lib/wallet/use-wallet";
import { IssueApiError, apiErrorMessage } from "./issue-errors";
import { ErrorCard } from "./issue-progress";
import { FIELD } from "./student-search";

type Item = BatchRow & { file: File; docHash?: Hex; studentRef?: Hex; slug?: string; error?: string };
type Chunk = { items: Item[]; txHash?: Hex; txUrl?: string; saved?: boolean };
type Job = { items: Item[]; credType32?: Hex; chunks?: Chunk[] };

async function postJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new IssueApiError(apiErrorMessage(body?.error));
  return body as T;
}

/** The /issuer/batch form: CSV plus PDFs named by student number, issued in chunks of 50 (alvin/12). */
export function BatchFlow() {
  const { provider, signAuthHeaders } = useWallet();
  const authHeaders = useAuthHeaders(signAuthHeaders);
  const [credType, setCredType] = useState<CredType>("CERT_SEMINAR");
  const [csv, setCsv] = useState<{ name: string; rows: BatchRow[]; badLines: number[] } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  // The run loop mutates `job` as steps finish so a retry resumes; `view` is the copy render reads.
  const job = useRef<Job | null>(null);
  const [view, setView] = useState<Job | null>(null);
  const repaint = () => setView(job.current && { ...job.current });

  const match = csv ? matchBatch(csv.rows, files) : null;
  const started = !!view;
  const done = !!view?.chunks?.every((c) => c.saved);

  async function prepare(j: Job) {
    const todo = j.items.filter((i) => !i.studentRef && !i.error);
    for (const [n, item] of todo.entries()) {
      setStatus(`Uploading ${n + 1} of ${todo.length}: ${item.file.name}`);
      try {
        item.docHash ??= await sha256Hex(item.file);
        const form = new FormData();
        form.set("file", item.file);
        form.set("studentNo", item.studentNo);
        form.set("credType", credType);
        form.set("title", item.title);
        form.set("docHash", item.docHash);
        const prep = await postJson<{ studentRef: Hex; credType32: Hex }>("/api/credentials/prepare", {
          method: "POST",
          headers: await authHeaders(),
          body: form,
        });
        item.studentRef = prep.studentRef;
        j.credType32 = prep.credType32;
      } catch (e) {
        if (!(e instanceof IssueApiError)) throw e; // wallet or network trouble: stop, retry resumes here
        item.error = e.message; // this row only: leave it out of the batch
      }
      repaint();
    }
  }

  async function run() {
    if (!provider) return setError("MetaMask is not ready. Reload the page, then try again.");
    if (!job.current) {
      if (!match?.matched.length) return;
      job.current = { items: match.matched.map((r) => ({ ...r })) };
    }
    const j = job.current;
    setError(null);
    setRunning(true);
    try {
      await prepare(j);
      // Chunks are fixed once the first transaction may have been sent, so a retry never re-issues a row.
      j.chunks ??= chunk(j.items.filter((i) => i.studentRef)).map((items) => ({ items }));
      for (const [n, c] of j.chunks.entries()) {
        if (c.saved) continue;
        const label = j.chunks.length > 1 ? ` (batch ${n + 1} of ${j.chunks.length})` : "";
        // A mined transaction only needs its database rows. Never send a second tx.
        if (!c.txHash) {
          setStatus(`Sign ${c.items.length} credentials in MetaMask${label}.`);
          const tx = await issueBatch(
            await getWriteContract(provider),
            c.items.map((i) => i.docHash!),
            c.items.map((i) => i.studentRef!),
            j.credType32!,
          );
          setStatus(`Confirming on BSC Testnet${label}…`);
          const receipt = await tx.wait();
          if (receipt?.status !== 1) throw new Error("Transaction reverted");
          c.txHash = tx.hash as Hex;
        }
        setStatus(`Saving records${label}…`);
        const res = await postJson<{ txUrl: string; results: { docHash: string; slug?: string; error?: string }[] }>(
          "/api/credentials/batch",
          {
            method: "POST",
            headers: { ...(await authHeaders()), "Content-Type": "application/json" },
            body: JSON.stringify({ txHash: c.txHash, items: c.items.map((i) => ({ docHash: i.docHash, title: i.title })) }),
          },
        );
        c.txUrl = res.txUrl;
        res.results.forEach((r, k) => {
          c.items[k].slug = r.slug;
          c.items[k].error = r.error && apiErrorMessage(r.error);
        });
        c.saved = true;
        repaint();
      }
      setStatus("Done.");
    } catch (e) {
      if (e instanceof IssueApiError) setError(e.message);
      else {
        console.error(e);
        setError(mapContractError(e));
      }
    } finally {
      setRunning(false);
      repaint();
    }
  }

  function reset() {
    job.current = null;
    setView(null);
    setCsv(null);
    setFiles([]);
    setStatus("");
    setError(null);
  }

  async function onCsv(f: File | undefined) {
    setCsv(f ? { name: f.name, ...parseBatchCsv(await f.text()) } : null);
  }

  const locked = running || started;
  const issueCount = match?.matched.length ?? 0;
  const chunks = Math.ceil(issueCount / 50);

  return (
    <div className="flex flex-wrap items-start gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="flex min-w-0 flex-[1_1_520px] flex-col gap-6 rounded-3xl border border-cc-line bg-white p-8 max-[560px]:p-5"
      >
        <div className="flex flex-col gap-2.5">
          <label htmlFor="btype" className="text-sm font-semibold">
            Credential type (same for every row)
          </label>
          <select
            id="btype"
            className={FIELD}
            disabled={locked}
            value={credType}
            onChange={(e) => setCredType(e.currentTarget.value as CredType)}
          >
            {CRED_TYPES.map((t) => (
              <option key={t} value={t}>
                {CRED_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="bcsv" className="text-sm font-semibold">
            CSV file
          </label>
          <p id="bcsv-hint" className="m-0 text-sm text-cc-muted">
            Two columns: <code>student_no,title</code>. One row per credential.
          </p>
          <input
            id="bcsv"
            type="file"
            accept=".csv,text/csv"
            aria-describedby="bcsv-hint"
            disabled={locked}
            className={FIELD}
            onChange={(e) => void onCsv(e.currentTarget.files?.[0])}
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <label htmlFor="bpdfs" className="text-sm font-semibold">
            Official PDFs
          </label>
          <p id="bpdfs-hint" className="m-0 text-sm text-cc-muted">
            Select them all at once. Name each file by student number, e.g. <code>2024-0001.pdf</code>.
          </p>
          <input
            id="bpdfs"
            type="file"
            multiple
            accept="application/pdf,.pdf"
            aria-describedby="bpdfs-hint"
            disabled={locked}
            className={FIELD}
            onChange={(e) =>
              setFiles([...(e.currentTarget.files ?? [])].filter((f) => f.name.toLowerCase().endsWith(".pdf")))
            }
          />
        </div>

        {csv && match && !started && (
          <div className="flex flex-col gap-2 text-sm" aria-live="polite">
            <p className="m-0 font-semibold">
              {issueCount} of {csv.rows.length} rows ready
              {chunks > 1 && `, in ${chunks} signatures`}.
            </p>
            {csv.badLines.length > 0 && <p className="m-0">Unreadable CSV lines: {csv.badLines.join(", ")}.</p>}
            {match.missingPdf.length > 0 && <p className="m-0">No PDF for: {match.missingPdf.join(", ")}.</p>}
            {match.extraPdf.length > 0 && <p className="m-0">No CSV row for: {match.extraPdf.join(", ")}.</p>}
            {match.duplicates.length > 0 && (
              <p className="m-0">Listed more than once, left out: {match.duplicates.join(", ")}.</p>
            )}
          </div>
        )}

        {done ? (
          <Button variant="ink-outline" size="pill-lg" onClick={reset}>
            Start another batch
          </Button>
        ) : (
          <Button type="submit" variant="ink" size="pill-lg" disabled={running || (!started && issueCount === 0)}>
            {started ? "Continue" : `Sign and issue ${issueCount || ""}`.trim()}
          </Button>
        )}
        <p className="m-0 -mt-3 text-sm text-cc-muted" role="status">
          {status}
        </p>
      </form>

      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
        {error && <ErrorCard message={error} onRetry={() => void run()} />}
        {view && <Results job={view} />}
      </div>
    </div>
  );
}

function Results({ job }: { job: Job }) {
  const txFor = (item: Item) => job.chunks?.find((c) => c.items.includes(item))?.txUrl;
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-cc-line bg-white p-6">
      <h2 className="m-0 text-lg font-semibold">Results</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-[13px] text-cc-muted-2">
            <tr>
              <th className="py-2 font-semibold">Student</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Links</th>
            </tr>
          </thead>
          <tbody>
            {job.items.map((item) => {
              const tx = txFor(item);
              return (
                <tr key={item.studentNo} className="border-t border-cc-line align-top">
                  <td className="py-2 pr-3 font-mono">{item.studentNo}</td>
                  <td className="py-2 pr-3">
                    {item.slug ? (
                      <span className="font-semibold">
                        <span className="text-cc-valid" aria-hidden="true">✓</span> Issued
                      </span>
                    ) : item.error ? (
                      <span>
                        <span className="font-semibold text-cc-tampered" aria-hidden="true">✕</span> Failed: {item.error}
                      </span>
                    ) : (
                      <span className="text-cc-muted">Pending</span>
                    )}
                  </td>
                  <td className="flex flex-wrap gap-3 py-2">
                    {item.slug && (
                      <a href={`/v/${item.slug}`} className="underline underline-offset-4">
                        Share link
                      </a>
                    )}
                    {tx && (
                      <a href={tx} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        Transaction<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
