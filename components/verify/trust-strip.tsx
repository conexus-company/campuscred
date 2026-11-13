import { CONTRACT_ADDRESS, EXPLORER_URL } from "@/lib/contract/config";

const linkClass =
  "flex min-h-8 items-center font-mono text-[13px] text-cc-ink underline decoration-cc-yellow decoration-2 underline-offset-[5px]";

/** True while lib/contract/config.ts still holds the zero placeholder (before CP2). */
export const contractDeployed = !/^0x0{40}$/i.test(CONTRACT_ADDRESS);

/** Contract address link to BscScan, or the visible [CONTRACT ADDRESS] placeholder before deployment. */
export function ContractLink({ suffix = "" }: { suffix?: string }) {
  if (!contractDeployed) {
    return <span className={linkClass}>[CONTRACT ADDRESS]{suffix}</span>;
  }
  return (
    <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" className={linkClass}>
      {CONTRACT_ADDRESS}
      {suffix}
      <span className="sr-only"> (opens BscScan in a new tab)</span>
    </a>
  );
}

/** "Checked on BNB Smart Chain. Your file never left this device." plus the contract link. */
export function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-cc-line bg-white px-[22px] py-4 text-sm text-cc-muted">
      <div className="flex items-center gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cc-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Checked on BNB Smart Chain. Your file never left this device.
      </div>
      <ContractLink suffix=" on BscScan" />
    </div>
  );
}
