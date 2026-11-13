import { IssueFlow } from "@/components/issuer/issue-flow";
import { PageBanner } from "@/components/shell/page-banner";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function IssueNewPage() {
  return (
    <>
      <PageBanner
        title="Issue a credential"
        subtitle="The PDF is fingerprinted in your browser. Only the fingerprint goes on the chain."
      />
      <IssueFlow />
    </>
  );
}
