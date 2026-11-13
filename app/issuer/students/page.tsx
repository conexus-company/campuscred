import { Suspense } from "react";
import { StudentsView } from "@/components/issuer/students-view";
import { PageBanner } from "@/components/shell/page-banner";

// Rendered only after the layout's RoleGate checks MetaMask in the browser.
export const instant = false;

export default function StudentsPage() {
  return (
    <>
      <PageBanner title="Students" subtitle="Pick a student to see and revoke their credentials." />
      {/* useSearchParams suspends under cacheComponents. */}
      <Suspense fallback={<p className="m-0 text-cc-muted">Loading students…</p>}>
        <StudentsView />
      </Suspense>
    </>
  );
}
