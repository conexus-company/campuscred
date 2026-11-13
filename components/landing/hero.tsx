import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { RollText } from "@/components/shell/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { LetterReveal } from "./letter-reveal";

const ANCHORS = [
  { href: "#the-problem", label: "(The problem)" },
  { href: "#answers", label: "(Answers)" },
  { href: "#cc-steps", label: "(How it works)" },
];

/** Full-bleed yellow hero with the nav (prototype "1 · Landing"). Topo, notes and marquee come in gil/05. */
export function Hero() {
  return (
    <header className="relative h-[1000px] overflow-hidden bg-cc-yellow text-cc-ink max-[560px]:h-auto max-[560px]:min-h-[720px] max-[560px]:pb-20">
      <div className="relative z-5 flex h-24 items-center justify-between gap-4 px-16 max-[980px]:px-6">
        <Logo href="/" className="text-[26px] max-[400px]:text-xl" />
        <nav aria-label="Sections" className="flex gap-10 text-base font-medium max-[980px]:hidden">
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} className="group">
              <RollText>{a.label}</RollText>
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/signup"
            className={buttonVariants({
              variant: "ink-outline",
              size: "pill-sm",
              className: "max-[560px]:hidden",
            })}
          >
            Sign up
          </Link>
          <Link href="/verify" className={buttonVariants({ variant: "ink", size: "pill-sm" })}>
            <span className="max-[420px]:hidden">Verify a document</span>
            <span className="hidden max-[420px]:inline">Verify</span>
          </Link>
        </div>
      </div>

      <div className="cc-avoid relative z-3 px-16 pt-[54px] max-[980px]:px-6">
        <LetterReveal
          className="text-[clamp(64px,10.4vw,164px)] leading-[0.9]"
          lines={[{ text: "Drop it." }, { text: "Check it.", indent: "7vw" }, { text: "Trust it.", indent: "1.5vw" }]}
        />
        <p className="mt-10 mb-0 max-w-[540px] text-[21px] leading-[1.55] text-[#1F1700] max-[560px]:text-lg">
          CampusCred lets anyone confirm a diploma, transcript or certificate from Batangas State University without
          emailing the registrar. Drop in the PDF and your browser checks it against the record on the blockchain.
        </p>
        <div className="mt-[30px] flex flex-wrap gap-3.5">
          <Link href="/verify" className={buttonVariants({ variant: "ink", size: "pill-lg" })}>
            Verify a document
          </Link>
          <Link
            href="/login"
            className={buttonVariants({
              variant: "ink-outline",
              size: "pill-lg",
            })}
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
