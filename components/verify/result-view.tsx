"use client";

import type { Ref } from "react";
import { STATUS_ON_DARK, STATUS_LABEL, StatusPill } from "@/components/brand/status-pill";
import { credTypeLabel, formatDate, revokeReasonText } from "@/lib/format";
import type { ChainRecord, VerifyResultKind } from "@/lib/types/credential";

export type ResultData = {
  result: VerifyResultKind;
  record: ChainRecord;
  issuer: string;
};

export function resultMessage({ result, record, issuer }: ResultData): string {
  switch (result) {
    case "valid":
      return `Issued by ${issuer} on ${record.issuedAt ? formatDate(record.issuedAt) : "an unknown date"}.`;
    case "revoked":
      return `Revoked on ${record.revokedAt ? formatDate(record.revokedAt) : "an unknown date"}. Reason: ${revokeReasonText(record.revokeReason)}.`;
    case "tampered":
      return "This file does not match the issued credential.";
    default:
      return "This document was not issued through CampusCred, or it was changed.";
  }
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/8 px-[18px] py-3.5">
      <div className="text-[13px] font-semibold text-cc-on-dark-muted">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}

/** Dark result banner: pill, status word at display size, message, details (prototype Verify.dc.html). */
export function ResultView({ headingRef, ...data }: ResultData & { headingRef?: Ref<HTMLHeadingElement> }) {
  const { result, record, issuer } = data;
  const hasRecord = result === "valid" || result === "revoked";

  return (
    <div className="cc-on-dark flex flex-col gap-[22px] rounded-[32px] bg-cc-side px-10 py-11 text-white max-[560px]:px-6 max-[560px]:py-8">
      <StatusPill status={result} size="md" className="self-start" />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-disp m-0 text-[clamp(56px,9vw,128px)] leading-[0.95] outline-none"
        style={{ color: STATUS_ON_DARK[result] }}
      >
        {STATUS_LABEL[result]}
      </h2>
      <p className="m-0 max-w-[640px] text-xl leading-normal text-[#F0E8C8]">{resultMessage(data)}</p>
      {hasRecord && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3">
          <Tile label="Issuer" value={issuer} />
          <Tile label="Type" value={credTypeLabel(record.credType)} />
          <Tile label="Issued" value={record.issuedAt ? formatDate(record.issuedAt) : "Unknown"} />
        </div>
      )}
      {result === "not_found" && (
        <div className="max-w-[640px] rounded-2xl bg-white/8 px-5 py-4 text-base leading-[1.6] text-[#F0E8C8]">
          Did this file come with a QR code or a link? Open that instead. CampusCred can then tell you whether the file
          was edited.
        </div>
      )}
    </div>
  );
}
