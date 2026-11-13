import type { CredType, RevokeReason } from "@/lib/types/credential";

/** Dates are shown in campus time so they never shift with the viewer's location. */
export const DISPLAY_TIME_ZONE = "Asia/Manila";

// Numeric parts only; month names come from a fixed table so output is the
// same on every runtime (ICU writes "Sept" for en-GB in some versions).
const DATE_PARTS = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "5 Nov 2026". Accepts unix seconds (as the chain stores them), an ISO string or a Date. */
export function formatDate(value: number | string | Date): string {
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  const parts = DATE_PARTS.formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${Number(part("day"))} ${MONTHS[Number(part("month")) - 1]} ${part("year")}`;
}

/** "0x9f2c4be7…a7c8": the first 10 characters (0x + 8) and the last 4. */
export function shortHash(hash: string, tail = 4): string {
  if (hash.length <= 10 + tail + 1) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-tail)}`;
}

/** "0x4a1b…c9e2": a wallet address shortened to 0x + 4 and the last 4. */
export function shortAddress(address: string): string {
  if (address.length <= 11) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export const CRED_TYPE_LABELS: Record<CredType, string> = {
  CERT_ENROLLMENT: "Certificate of Enrollment",
  CERT_GRADES: "Certificate of Grades",
  CERT_COMPLETION: "Certificate of Completion",
  CERT_GOOD_MORAL: "Certificate of Good Moral Character",
  CERT_SEMINAR: "Seminar certificate",
  DIPLOMA: "Diploma",
  TRANSCRIPT: "Transcript of Records",
};

export function credTypeLabel(type: CredType | "UNKNOWN"): string {
  return type === "UNKNOWN" ? "Unknown type" : CRED_TYPE_LABELS[type];
}

const REASON_TEXT: Record<RevokeReason, string> = {
  ISSUED_IN_ERROR: "issued in error",
  WRONG_DETAILS: "wrong details",
  REPLACED: "replaced by a corrected credential",
  FRAUD: "fraud",
};

/** Lower-case reason for use mid-sentence: "Reason: issued in error." */
export function revokeReasonText(reason: RevokeReason | null): string {
  return reason ? REASON_TEXT[reason] : "not given";
}
