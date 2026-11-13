import type { Metadata } from "next";
import { PageBanner } from "@/components/shell/page-banner";
import { PinnedNote } from "@/components/verify/pinned-note";
import { VerifyNav } from "@/components/verify/verify-nav";
import { VerifyUpload } from "@/components/verify/verify-upload";

export const metadata: Metadata = {
  title: "Verify a document · CampusCred",
  description: "Check a CampusCred credential PDF against BNB Smart Chain. The file is fingerprinted in your browser and never uploaded.",
};

export default function VerifyPage() {
  return (
    <div className="min-h-dvh bg-cc-page">
      <VerifyNav />
      <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-8 pt-2 pb-16 max-[560px]:px-4">
        <PageBanner
          tone="yellow"
          size="hero"
          className="cc-in"
          title="Verify a document"
          subtitle="Upload the PDF you were sent. Your browser fingerprints it and checks the chain. The file is never uploaded."
          action={
            <PinnedNote title="Your file stays on your device." className="mr-6 self-start">
              Only its fingerprint is compared with the record on BNB Smart Chain.
            </PinnedNote>
          }
        />
        <VerifyUpload />
      </main>
    </div>
  );
}
