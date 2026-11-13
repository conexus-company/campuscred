import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/shell/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Student login · CampusCred",
  description: "Sign in to see your credentials and share them with a QR code or link.",
};

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-cc-page">
      <SiteNav
        links={[
          { href: "/verify", label: "(Verify)" },
          { href: "/student", label: "(Students)" },
          { href: "/issuer", label: "(Issuers)" },
        ]}
        actions={
          // cn() merges the pill classes until develop has the buttonVariants fix from gil/04.
          <Link href="/verify" className={cn(buttonVariants({ variant: "ink", size: "pill-sm" }))}>
            <span className="max-[420px]:hidden">Verify a document</span>
            <span className="hidden max-[420px]:inline">Verify</span>
          </Link>
        }
      />
      <main className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_minmax(0,480px)] items-start gap-6 px-8 pt-2 pb-16 max-[900px]:grid-cols-1 max-[560px]:px-4">
        <section className="flex flex-col gap-[18px] rounded-[36px] bg-cc-yellow px-12 py-14 text-cc-ink max-[560px]:px-6 max-[560px]:py-8">
          <h1 className="font-disp m-0 text-[clamp(44px,6vw,88px)] leading-[0.95]">Your credentials, in one place.</h1>
          <p className="m-0 max-w-[480px] text-lg leading-[1.55] text-[#1F1700]">
            Sign in to see what your registrar issued, download the PDF, and share a QR code or link that anyone can
            check.
          </p>
        </section>
        <LoginForm />
      </main>
    </div>
  );
}
