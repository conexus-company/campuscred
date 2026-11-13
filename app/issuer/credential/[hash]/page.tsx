import { Suspense } from "react";
import { CredentialDetail } from "@/components/issuer/credential-detail";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function CredentialPage() {
  // useParams suspends on a dynamic route under cacheComponents (next/dist/docs use-params.md).
  return (
    <Suspense fallback={<p className="m-0 text-cc-muted">Loading credential…</p>}>
      <CredentialDetail />
    </Suspense>
  );
}
