"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HashText } from "@/components/brand/hash-text";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/ui/drop-zone";
import { getWriteContract, issueCredential, mapContractError, revokeCredential } from "@/lib/chain/write";
import { CRED_TYPES, type CredType } from "@/lib/contract/codes";
import type { Hex } from "@/lib/contract/config";
import { CRED_TYPE_LABELS, shortHash } from "@/lib/format";
import { isDocHash, sha256Hex } from "@/lib/hash";
import type { IssuerCredential } from "@/lib/server/issuer-credentials";
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

type OldStep = { kind: "idle" | "busy" | "done" } | { kind: "failed"; message: string };

/**
 * The /issuer/new form and issue sequence (prototype IssuerNew.dc.html).
 * With `?replaces=<docHash>` it re-issues: prefilled from the old credential, linked to it on confirm,
 * then the old one is revoked on chain as REPLACED.
 */
export function IssueFlow() {
  const { status, provider, signAuthHeaders } = useWallet();
  const router = useRouter();
  const replacesParam = useSearchParams().get("replaces")?.toLowerCase() ?? null;
  const replaces = replacesParam && isDocHash(replacesParam) ? (replacesParam as Hex) : null;
  const [old, setOld] = useState<IssuerCredential | null>(null);
  const [oldLoadError, setOldLoadError] = useState<string | null>(null);
  const [oldStep, setOldStep] = useState<OldStep>({ kind: "idle" });
  const oldRevokeTx = useRef<Hex | null>(null); // mined revoke of the old credential: a retry only records it
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
  const missing = [!student && "a student", !title.trim() && "a title", !file && "the PDF"].filter(Boolean);
  const ready = missing.length === 0;

  async function onFile(f: File) {
    const ticket = ++pick.current;
    setFile(null);
    try {
      const hash = await sha256Hex(f);
      if (ticket !== pick.current) return;
      setFile({ file: f, hash });
      if (phase === "idle") setError(null);
    } catch (e) {
      console.error(e); // crypto.subtle is missing outside https or localhost
      setError("Could not fingerprint the PDF. Open the app on https or localhost and try again.");
    }
  }

  const loadOld = useCallback(async () => {
    if (!replaces) return;
    try {
      const c = await postJson<IssuerCredential>(`/api/issuer/credentials/${replaces}`, { headers: await authHeaders() });
      if (!c.studentNo) throw new IssueApiError("The credential being replaced has no student on record.");
      setOld(c);
      setOldLoadError(null);
      setStudent({ studentNo: c.studentNo, fullName: c.studentName ?? c.studentNo });
      setCredType(c.credType);
      setTitle(c.title);
      setTitleEdited(true);
    } catch (e) {
      setOldLoadError(e instanceof IssueApiError ? e.message : "Could not load the credential being replaced.");
    }
  }, [replaces, authHeaders]);

  useEffect(() => {
    if (status === "ready" && replaces) void Promise.resolve().then(loadOld); // same pattern as CredentialsTable
  }, [status, replaces, loadOld]);

  /** Revokes the replaced credential as REPLACED. Errors stay in this step: the new credential is already issued. */
  async function revokeOld(target: Hex) {
    if (!provider) return setOldStep({ kind: "failed", message: "MetaMask is not ready. Reload, then retry." });
    setOldStep({ kind: "busy" });
    try {
      if (!oldRevokeTx.current) {
        const tx = await revokeCredential(await getWriteContract(provider), target, "REPLACED");
        const receipt = await tx.wait();
        if (receipt?.status !== 1) throw new Error("Transaction reverted");
        oldRevokeTx.current = tx.hash as Hex;
      }
      await postJson(`/api/credentials/${target}/revoke-confirm`, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: oldRevokeTx.current }),
      });
      setOldStep({ kind: "done" });
    } catch (e) {
      if (!(e instanceof IssueApiError)) console.error(e);
      setOldStep({ kind: "failed", message: e instanceof IssueApiError ? e.message : mapContractError(e) });
    }
  }

  async function confirm(docHash: Hex, tx: Hex) {
    setPhase("saving");
    const res = await postJson<{ slug: string; txUrl: string }>("/api/credentials/confirm", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ docHash, txHash: tx, title: title.trim(), ...(old && { replaces: old.docHash }) }),
    });
    setResult(res);
    setPhase("done");
    if (old?.status === "active") await revokeOld(old.docHash);
  }

  async function run() {
    if (!student || !file) return;
    if (!provider) return setError("MetaMask is not ready. Reload the page, then try again.");
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
    if (replaces) {
      setOld(null);
      setOldStep({ kind: "idle" });
      oldRevokeTx.current = null;
      router.replace("/issuer/new");
    }
    setStudent(null);
    setFile(null);
    setTxHash(null);
    setResult(null);
    setError(null);
    setPhase("idle");
    setTitleEdited(false);
    setTitle(defaultTitle(credType));
  }

  const locked = busy || !!txHash || phase === "done" || (!!replaces && !old);

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
          {replaces && (
            <div className="flex flex-col gap-1 rounded-[20px] bg-cc-butter px-5 py-4 text-[15px]">
              {old ? (
                <>
                  <span className="font-semibold">Re-issuing “{old.title}”</span>
                  <span className="text-cc-muted">
                    Upload the corrected PDF. The new credential is linked to {shortHash(old.docHash)}
                    {old.status === "active"
                      ? ", which is then revoked as “Replaced by a corrected credential” (a second MetaMask signature)."
                      : "."}
                  </span>
                </>
              ) : oldLoadError ? (
                <span role="alert" className="font-semibold text-[#991B1B]">
                  {oldLoadError}{" "}
                  <button type="button" className="underline" onClick={() => void loadOld()}>
                    Retry
                  </button>
                </span>
              ) : (
                <span className="text-cc-muted">Loading the credential being replaced…</span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <label htmlFor="student" className="text-sm font-semibold">
              Student
            </label>
            <StudentSearch value={student} onChange={setStudent} authHeaders={authHeaders} disabled={locked || !!replaces} />
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
          {!ready && !locked && <p className="m-0 -mt-3 text-sm text-cc-muted">Still needed: {missing.join(", ")}.</p>}
        </form>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          <ProgressCard phase={phase} failed={!!error} />
          {error && <ErrorCard message={error} onRetry={() => void run()} />}
          {result && old?.status === "active" && (
            <section
              aria-live="polite"
              className="flex flex-col gap-3 rounded-3xl border border-cc-line bg-white px-7 py-6 text-[15px]"
            >
              <h2 className="font-disp m-0 text-[22px]">Old credential</h2>
              {oldStep.kind === "busy" && (
                <p className="m-0 font-semibold">Revoking {shortHash(old.docHash)} as Replaced. Approve in MetaMask…</p>
              )}
              {oldStep.kind === "done" && <p className="m-0">Revoked as “Replaced by a corrected credential”.</p>}
              {oldStep.kind === "failed" && (
                <>
                  <p role="alert" className="m-0 font-semibold text-[#991B1B]">
                    New credential issued; the old one is still active. {oldStep.message}
                  </p>
                  <Button variant="ink" size="pill-sm" onClick={() => void revokeOld(old.docHash)}>
                    Revoke old credential
                  </Button>
                </>
              )}
            </section>
          )}
          {result && <SuccessCard slug={result.slug} txUrl={result.txUrl} onAgain={reset} />}
        </div>
      </div>
    </>
  );
}
