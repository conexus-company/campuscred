import { BatchFlow } from "@/components/issuer/batch-flow";
import { PageBanner } from "@/components/shell/page-banner";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function IssueBatchPage() {
  return (
    <>
      <PageBanner
        title="Batch issue"
        subtitle="Up to 50 credentials per MetaMask signature. Every PDF is fingerprinted in your browser."
      />
      <BatchFlow />
    </>
  );
}
