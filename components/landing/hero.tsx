import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { RollText } from "@/components/shell/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { KokonutTopoBackground } from "@/components/ui/kokonut-topo-background";
import { LetterReveal } from "./letter-reveal";
import { PinnedNotes } from "./pinned-notes";
import "./landing.css";

const ANCHORS = [
  { href: "#the-problem", label: "(The problem)" },
  { href: "#answers", label: "(Answers)" },
  { href: "#cc-steps", label: "(How it works)" },
];

const MARQUEE = [
  "Diploma",
  "Transcript",
  "Certificate of Enrollment",
  "Certificate of Grades",
  "Certificate of Completion",
  "Certificate of Good Moral",
  "Seminar certificate",
];

/** Full-bleed yellow hero (prototype "1 · Landing"): topo map, nav, headline, pinned notes, marquee. */
export function Hero() {
  return (
    <header className="relative h-[1000px] overflow-hidden bg-cc-yellow text-cc-ink max-[1100px]:h-auto max-[1100px]:min-h-[1000px] max-[1100px]:pb-[128px] max-[560px]:min-h-[720px]">
      <KokonutTopoBackground />

      <div className="relative z-5 flex h-24 items-center justify-between gap-4 px-16 max-[1100px]:px-10 max-[980px]:px-6">
        <Logo href="/" className="text-[26px] max-[400px]:text-xl" />
        <nav aria-label="Sections" className="flex gap-10 text-base font-medium whitespace-nowrap max-[1100px]:gap-6 max-[980px]:hidden">
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} className="group">
              <RollText>{a.label}</RollText>
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/signup"
            className={buttonVariants({ variant: "ink-outline", size: "pill-sm", className: "max-[560px]:hidden" })}
          >
            Sign up
          </Link>
          <Link href="/verify" className={buttonVariants({ variant: "ink", size: "pill-sm" })}>
            <span className="max-[420px]:hidden">Verify a document</span>
            <span className="hidden max-[420px]:inline">Verify</span>
          </Link>
        </div>
      </div>

      <div className="cc-avoid relative z-3 w-fit px-16 pt-[54px] max-[980px]:px-6">
        <LetterReveal
          className="text-[clamp(64px,10.4vw,164px)] leading-[0.9]"
          lines={[{ text: "Drop it." }, { text: "Check it.", indent: "7vw" }, { text: "Trust it.", indent: "1.5vw" }]}
        />
        <p
          className="cc-land-fade mt-10 mb-0 max-w-[540px] text-[21px] leading-[1.55] text-[#1F1700] max-[560px]:text-lg"
          style={{ animationDelay: "1.5s" }}
        >
          CampusCred lets anyone confirm a diploma, transcript or certificate from Batangas State University without
          emailing the registrar. Drop in the PDF and your browser checks it against the record on the blockchain.
        </p>
        <div className="cc-land-fade mt-[30px] flex flex-wrap gap-3.5" style={{ animationDelay: "1.7s" }}>
          <Link href="/verify" className={buttonVariants({ variant: "ink", size: "pill-lg" })}>
            Verify a document
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "ink-outline", size: "pill-lg" })}>
            Login
          </Link>
        </div>
      </div>

      <PinnedNotes />
      <div
        aria-hidden="true"
        className="cc-land-hint cc-land-fade absolute right-16 bottom-[106px] z-3 text-sm text-[#1F1700]"
        style={{ animationDelay: "2.6s" }}
      >
        Drag the notes around
      </div>

      <div
        aria-hidden="true"
        className="cc-land-marquee absolute inset-x-0 bottom-0 z-3 flex h-[72px] items-center overflow-hidden bg-cc-ink"
      >
        <div className="cc-land-track flex flex-none whitespace-nowrap">
          {[0, 1, 2, 3].flatMap((copy) =>
            MARQUEE.map((label) => (
              <span
                key={`${copy}-${label}`}
                className="inline-flex items-center gap-[22px] pr-[22px] text-[19px] font-semibold text-cc-yellow"
              >
                {label}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
                </svg>
              </span>
            )),
          )}
        </div>
      </div>
    </header>
  );
}
