import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { SlugVerify } from "@/components/verify/slug-verify";
import { VerifyNav } from "@/components/verify/verify-nav";
import { getSlugMeta, type SlugMeta, SlugLookupError } from "@/lib/verify/slug-meta";

export const metadata: Metadata = {
  title: "Verify a credential · CampusCred",
  description: "Check a CampusCred credential against BNB Smart Chain.",
  // Share links are private to whoever holds them.
  robots: { index: false, follow: false },
};

export default function SlugPage({ params }: PageProps<"/v/[slug]">) {
  return (
    <div className="min-h-dvh bg-cc-page">
      <VerifyNav />
      <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-8 pt-2 pb-16 max-[560px]:px-4">
        <Suspense fallback={<Loading />}>
          <SlugContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function SlugContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let meta: SlugMeta | null;
  try {
    meta = await getSlugMeta(slug);
  } catch (err) {
    if (err instanceof SlugLookupError) return <LookupFailed />;
    throw err;
  }
  if (!meta) return <NoRecord />;
  return <SlugVerify meta={meta} />;
}

function Loading() {
  return (
    <div role="status" className="rounded-[32px] bg-cc-side px-10 py-11 text-cc-on-dark max-[560px]:px-6 max-[560px]:py-8">
      <p className="font-disp m-0 text-[34px] max-[560px]:text-[28px]">Loading the credential…</p>
    </div>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="cc-in flex flex-col gap-5 rounded-[32px] bg-cc-side px-10 py-11 text-white max-[560px]:px-6 max-[560px]:py-8">
      <h1 className="font-disp m-0 text-[clamp(44px,7vw,96px)] leading-[0.95]" style={{ color: "var(--cc-notfound-dark)" }}>
        {title}
      </h1>
      <p className="m-0 max-w-[640px] text-xl leading-normal text-[#F0E8C8]">{text}</p>
      <div className="pt-2">
        <Link href="/verify" className={buttonVariants({ variant: "yellow", size: "pill-lg" })}>
          Check a PDF instead
        </Link>
      </div>
    </div>
  );
}

function NoRecord() {
  return (
    <Message
      title="No record found"
      text="This link does not point to a public CampusCred credential. It may be mistyped, or the student made it private."
    />
  );
}

function LookupFailed() {
  return <Message title="Couldn’t load this link" text="CampusCred could not be reached. Reload the page in a moment." />;
}
