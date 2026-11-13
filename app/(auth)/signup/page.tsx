import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/shell/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Set up your account · CampusCred",
  description: "Claim the student record your registrar created and pick a password.",
};

export default function SignupPage() {
  return (
    <div className="min-h-dvh bg-cc-page">
      <SiteNav
        links={[
          { href: "/verify", label: "(Verify)" },
          { href: "/student", label: "(Students)" },
          { href: "/issuer", label: "(Issuers)" },
        ]}
        actions={
          <Link href="/login" className={cn(buttonVariants({ variant: "ink", size: "pill-sm" }))}>
            Sign in
          </Link>
        }
      />
      <main className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_minmax(0,480px)] items-start gap-6 px-8 pt-2 pb-16 max-[900px]:grid-cols-1 max-[560px]:px-4">
        <section className="flex flex-col gap-[18px] rounded-[36px] bg-cc-yellow px-12 py-14 text-cc-ink max-[560px]:px-6 max-[560px]:py-8">
          <h1 className="font-disp m-0 text-[clamp(44px,6vw,88px)] leading-[0.95]">First time here?</h1>
          <p className="m-0 max-w-[480px] text-lg leading-[1.55] text-[#1F1700]">
            Your registrar already created your record. Match it with your student number and email, pick a password,
            and your credentials are ready.
          </p>
        </section>
        <SignupForm />
      </main>
    </div>
  );
}
