"use client";

import { useRef, useState } from "react";
import { HashText } from "@/components/brand/hash-text";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/ui/drop-zone";
import { getWriteContract, issueCredential, mapContractError } from "@/lib/chain/write";
import { CRED_TYPES, type CredType } from "@/lib/contract/codes";
import type { Hex } from "@/lib/contract/config";
import { CRED_TYPE_LABELS } from "@/lib/format";
import { sha256Hex } from "@/lib/hash";
import { useAuthHeaders } from "@/lib/wallet/use-auth-headers";
import { useWallet } from "@/lib/wallet/use-wallet";
import { IssueApiError, apiErrorMessage } from "./issue-errors";
import { ErrorCard, ProgressCard, StatusIsland, SuccessCard, type Phase } from "./issue-progress";
import { FIELD, StudentSearch, type Student } from "./student-search";

// shortcut: fixed academic term for the default title; derive it from the date when terms roll over.
const defaultTitle = (t: CredType) => `${CRED_TYPE_LABELS[t]}, 1st Sem AY 2026–2027`;

async function postJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new IssueApiError(apiErrorMessage(body?.error));
  return body as T;
}

/** The /issuer/new form and issue sequence (prototype IssuerNew.dc.html). */
export function IssueFlow() {
  const { provider, signAuthHeaders } = useWallet();
  const [student, setStudent] = useState<Student | null>(null);
  const [credType, setCredType] = useState<CredType>("CERT_ENROLLMENT");
  const [title, setTitle] = useState(defaultTitle("CERT_ENROLLMENT"));
  const [titleEdited, setTitleEdited] = useState(false);
  const [file, setFile] = useState<{ file: File; hash: Hex } | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [result, setResult] = useState<{ slug: string; txUrl: string } | null>(null);
  const pick = useRef(0); // drops a hash that finished after a newer file was chosen
  const authHeaders = useAuthHeaders(signAuthHeaders);

  const busy = phase !== "idle" && phase !== "done" && !error;
  const ready = !!student && !!title.trim() && !!file && !!provider;

  async function onFile(f: File) {
    const ticket = ++pick.current;
    setFile(null);
    const hash = await sha256Hex(f);
    if (ticket === pick.current) setFile({ file: f, hash });
  }

  async function confirm(docHash: Hex, tx: Hex) {
    setPhase("saving");
    const res = await postJson<{ slug: string; txUrl: string }>("/api/credentials/confirm", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ docHash, txHash: tx, title: title.trim() }),
    });
    setResult(res);
    setPhase("done");
  }

  async function run() {
    if (!student || !file || !provider) return;
    setError(null);
    try {
      // The transaction is already mined: only the database record is missing. Never send a second tx.
      if (txHash) return await confirm(file.hash, txHash);

      setPhase("uploading");
      const form = new FormData();
      form.set("file", file.file);
      form.set("studentNo", student.studentNo);
      form.set("credType", credType);
      form.set("title", title.trim());
      form.set("docHash", file.hash);
      const prep = await postJson<{ docHash: Hex; studentRef: Hex; credType32: Hex }>("/api/credentials/prepare", {
        method: "POST",
        headers: await authHeaders(),
        body: form,
      });

      setPhase("wallet");
      const tx = await issueCredential(await getWriteContract(provider), prep.docHash, prep.studentRef, prep.credType32);
      setPhase("confirming");
      const receipt = await tx.wait();
      if (receipt?.status !== 1) throw new Error("Transaction reverted");
      setTxHash(tx.hash as Hex);
      await confirm(prep.docHash, tx.hash as Hex);
    } catch (e) {
      if (e instanceof IssueApiError) setError(e.message);
      else {
        console.error(e);
        setError(mapContractError(e));
      }
    }
  }

  function reset() {
    setStudent(null);
    setFile(null);
    setTxHash(null);
    setResult(null);
    setError(null);
    setPhase("idle");
    setTitleEdited(false);
    setTitle(defaultTitle(credType));
  }

  const locked = busy || !!txHash || phase === "done";

  return (
    <>
      <StatusIsland phase={phase} failed={!!error} />
      <div className="flex flex-wrap items-start gap-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
          className="flex min-w-0 flex-[1_1_520px] flex-col gap-6 rounded-3xl border border-cc-line bg-white p-8 max-[560px]:p-5"
        >
          <div className="flex flex-col gap-2.5">
            <label htmlFor="student" className="text-sm font-semibold">
              Student
            </label>
            <StudentSearch value={student} onChange={setStudent} authHeaders={authHeaders} disabled={locked} />
          </div>
          <div className="flex flex-col gap-2.5">
            <label htmlFor="ctype" className="text-sm font-semibold">
              Credential type
            </label>
            <select
              id="ctype"
              className={FIELD}
              disabled={locked}
              value={credType}
              onChange={(e) => {
                const t = e.currentTarget.value as CredType;
                setCredType(t);
                if (!titleEdited) setTitle(defaultTitle(t));
              }}
            >
              {CRED_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CRED_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2.5">
            <label htmlFor="ctitle" className="text-sm font-semibold">
              Title
            </label>
            <input
              id="ctitle"
              type="text"
              maxLength={200}
              className={FIELD}
              disabled={locked}
              value={title}
              onChange={(e) => {
                setTitle(e.currentTarget.value);
                setTitleEdited(true);
              }}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-sm font-semibold">Official PDF</div>
            {file ? (
              <div className="flex flex-col gap-4 rounded-[20px] border-[1.5px] border-[#E0D8B8] p-[22px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0 text-[15px] font-semibold break-all">{file.file.name}</span>
                  <Button variant="ink-outline" size="pill-sm" disabled={locked} onClick={() => setFile(null)}>
                    Remove
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-cc-muted-2">SHA-256 fingerprint</div>
                  <HashText value={file.hash} scramble className="text-sm leading-[1.7]" />
                </div>
              </div>
            ) : (
              <DropZone
                size="compact"
                onFile={(f) => void onFile(f)}
                title="Drop the PDF here"
                disabled={locked}
              />
            )}
          </div>
          <Button type="submit" variant="ink" size="pill-lg" disabled={!ready || locked}>
            Sign and issue
          </Button>
        </form>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          <ProgressCard phase={phase} failed={!!error} />
          {error && <ErrorCard message={error} onRetry={() => void run()} />}
          {result && <SuccessCard slug={result.slug} txUrl={result.txUrl} onAgain={reset} />}
        </div>
      </div>
    </>
  );
}
