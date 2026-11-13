import { cn } from "@/lib/utils";

/**
 * Mirrors VerifyResultKind ("valid" | "revoked" | "tampered" | "not_found") from
 * lib/types/credential.ts (gil/01) plus the two record states used by the
 * issuer and student screens. Declared here so gil/00 has no dependency on gil/01.
 */
export type PillStatus = "valid" | "revoked" | "tampered" | "not_found" | "active" | "pending" | "match";

export const STATUS_LABEL: Record<PillStatus, string> = {
  valid: "Valid",
  revoked: "Revoked",
  tampered: "Tampered",
  not_found: "Not found",
  active: "Active",
  pending: "Pending",
  match: "Match",
};

/** Dot colours. Exported so result screens can colour the large status word to match. */
export const STATUS_DOT: Record<PillStatus, string> = {
  valid: "var(--cc-valid)",
  active: "var(--cc-valid)",
  match: "var(--cc-valid)",
  revoked: "var(--cc-revoked)",
  tampered: "var(--cc-tampered)",
  not_found: "var(--cc-notfound)",
  pending: "var(--cc-yellow)",
};

/** Brighter variants for text or dots placed directly on a dark surface. */
export const STATUS_ON_DARK: Record<PillStatus, string> = {
  valid: "var(--cc-valid-dark)",
  active: "var(--cc-valid-dark)",
  match: "var(--cc-valid-dark)",
  revoked: "var(--cc-revoked-dark)",
  tampered: "var(--cc-tampered-dark)",
  not_found: "var(--cc-notfound-dark)",
  pending: "var(--cc-yellow)",
};

type StatusPillProps = {
  status: PillStatus;
  /** Override the word. The dot always stays, so status is never colour alone. */
  label?: string;
  /** "md" matches the dark result banners on /verify; "sm" matches lists and title blocks. */
  size?: "sm" | "md";
  className?: string;
};

/** White pill with a coloured dot and a word. Reads the same on light and dark surfaces. */
export function StatusPill({ status, label, size = "sm", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#E7E2CF] bg-white font-semibold text-cc-ink",
        size === "sm" ? "gap-[7px] py-1 pr-3 pl-2.5 text-[13px]" : "gap-2 py-[5px] pr-3.5 pl-3 text-sm",
        className,
      )}
    >
      <i aria-hidden="true" className="block size-2 rounded-full" style={{ background: STATUS_DOT[status] }} />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
