"use client";

import { useEffect, useRef, useState } from "react";
import { HashText } from "@/components/brand/hash-text";
import { useReducedMotion } from "@/components/brand/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/ui/drop-zone";
import { readChainRecord } from "@/lib/chain/read";
import { sha256Hex } from "@/lib/hash";
import type { ChainRecord, Hex, VerifyResultKind } from "@/lib/types/credential";
import { decideResult } from "@/lib/verify/decide-result";
import { issuerName, prefetchIssuers } from "@/lib/verify/issuers";
import { ResultView } from "./result-view";
import { TrustStrip } from "./trust-strip";

/** The fingerprint animation runs about this long (prototype: 24 frames x 40 ms) so a fast read doesn't flash. */
const MIN_HASHING_MS = 960;

type State =
  | { phase: "idle" }
  | { phase: "hashing"; fileName: string; hash?: Hex }
  | { phase: "done"; fileName: string; hash: Hex; result: VerifyResultKind; record: ChainRecord; issuer: string }
  | { phase: "error"; fileName: string; hash?: Hex; title: string; text: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * /verify flow: drop a PDF, hash it on the device, read the chain, decide with
 * the bare-upload rules (pr-gil.md 3.7). The file never leaves the browser.
 */
export function VerifyUpload() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const run = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();

  // Move focus to the result so keyboard and screen reader users land on it.
  useEffect(() => {
    if (state.phase === "done" || state.phase === "error") headingRef.current?.focus();
  }, [state.phase]);

  async function lookup(id: number, fileName: string, hash: Hex, started: number) {
    try {
      const [record] = await Promise.all([readChainRecord(hash), wait(reduced ? 0 : MIN_HASHING_MS)]);
      const result = decideResult({ record, openedViaSlug: false, uploadedDocHash: hash });
      const issuer = record.status === "none" ? "" : await issuerName(record.issuer);
      if (id !== run.current) return;
      if (process.env.NODE_ENV !== "production") {
        console.info(`[verify] ${result} in ${Math.round(performance.now() - started)} ms`);
      }
      setState({ phase: "done", fileName, hash, result, record, issuer });
    } catch {
      if (id !== run.current) return;
      setState({
        phase: "error",
        fileName,
        hash,
        title: "Couldn’t reach BNB Smart Chain",
        text: "Your file was not checked. Check your connection and try again.",
      });
    }
  }

  async function check(file: File) {
    const id = ++run.current;
    const started = performance.now();
    prefetchIssuers();
    setState({ phase: "hashing", fileName: file.name });
    let hash: Hex;
    try {
      hash = await sha256Hex(file);
    } catch {
      if (id !== run.current) return;
      setState({
        phase: "error",
        fileName: file.name,
        title: "Couldn’t read this file",
        text: "Choose the PDF again, or try another copy.",
      });
      return;
    }
    if (id !== run.current) return;
    setState({ phase: "hashing", fileName: file.name, hash });
    await lookup(id, file.name, hash, started);
  }

  function retry() {
    if (state.phase !== "error" || !state.hash) return;
    const id = ++run.current;
    setState({ phase: "hashing", fileName: state.fileName, hash: state.hash });
    void lookup(id, state.fileName, state.hash, performance.now());
  }

  function reset() {
    run.current++;
    setState({ phase: "idle" });
  }

  if (state.phase === "idle") {
    return (
      <div className="cc-in rounded-[28px] border border-cc-line bg-white p-8 [animation-delay:0.1s] max-[560px]:p-4">
        <DropZone onFile={check} />
      </div>
    );
  }

  if (state.phase === "hashing") {
    return (
      <div role="status" className="flex flex-col gap-[22px] rounded-[28px] border border-cc-line bg-white px-10 py-11 max-[560px]:px-5 max-[560px]:py-8">
        <h2 className="font-disp m-0 text-[34px] max-[560px]:text-[28px]">Computing fingerprint…</h2>
        <div className="text-[15px] break-all text-cc-muted-2">{state.fileName}</div>
        <div className="min-h-[3.2em] text-[19px] leading-[1.6] max-[560px]:text-base">
          {state.hash ? <HashText value={state.hash} scramble mutedTail={false} /> : <span className="text-cc-muted">Reading the file…</span>}
        </div>
        <div className="h-2 overflow-hidden rounded bg-cc-track">
          <div className="cc-fill h-2 bg-cc-ink" />
        </div>
        <div className="text-sm text-cc-muted-2">Then reading the record from BNB Smart Chain.</div>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="cc-in flex flex-col gap-4 rounded-[28px] border border-cc-line bg-white px-10 py-11 max-[560px]:px-5 max-[560px]:py-8">
        <h2 ref={headingRef} tabIndex={-1} className="font-disp m-0 text-[34px] outline-none max-[560px]:text-[28px]">
          {state.title}
        </h2>
        <p className="m-0 text-base text-cc-muted">{state.text}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {state.hash && (
            <Button variant="ink" size="pill-lg" onClick={retry}>
              Try again
            </Button>
          )}
          <Button variant={state.hash ? "ink-outline" : "ink"} size="pill-lg" onClick={reset}>
            Check another file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-in flex flex-col gap-4">
      <ResultView headingRef={headingRef} result={state.result} record={state.record} issuer={state.issuer} />
      <div className="flex flex-col gap-2.5 rounded-[28px] border border-cc-line bg-white px-7 py-6 max-[560px]:px-5">
        <div className="text-[13px] font-semibold break-all text-cc-muted-2">SHA-256 of {state.fileName}</div>
        <div className="text-sm leading-[1.7]">
          <HashText value={state.hash} />
        </div>
      </div>
      <TrustStrip />
      <div className="pt-2">
        <Button variant="ink" size="pill-lg" onClick={reset}>
          Check another file
        </Button>
      </div>
    </div>
  );
}
