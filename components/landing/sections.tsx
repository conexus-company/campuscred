import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AnswersCube } from "./answers-cube";
import { ScrollLitText } from "./scroll-lit";
import { Spotlight } from "./spotlight";
import { StepsRow } from "./steps-row";
import "./landing.css";

function Tag({ children }: { children: ReactNode }) {
  return <span className="font-disp inline-block rounded-md bg-cc-yellow px-3 py-0.5 text-lg">{children}</span>;
}

/** "The problem / The fix". Words light up as each paragraph scrolls into view. */
export function Problem() {
  return (
    <section
      id="the-problem"
      className="bg-cc-paper px-16 pt-[170px] pb-[150px] max-[980px]:px-6 max-[560px]:pt-24 max-[560px]:pb-20"
    >
      <div className="grid grid-cols-[260px_1fr] gap-10 max-[980px]:grid-cols-1 max-[980px]:gap-5">
        <div>
          <Tag>The problem</Tag>
        </div>
        <ScrollLitText
          className="font-disp m-0 max-w-[1180px] text-[clamp(34px,5vw,76px)] leading-[1.06]"
          text="Fake diplomas and altered transcripts are hard to catch. To check one, you email the registrar and wait for a reply that depends on that office staying reachable and honest."
        />
      </div>
      <div className="mt-[120px] grid grid-cols-[260px_1fr] gap-10 max-[980px]:mt-20 max-[980px]:grid-cols-1 max-[980px]:gap-5">
        <div>
          <Tag>The fix</Tag>
        </div>
        <ScrollLitText
          className="m-0 max-w-[1000px] font-serif text-[clamp(24px,2.5vw,38px)] leading-[1.5]"
          text="CampusCred records a fingerprint of every credential on BNB Smart Chain. Change a single letter in the PDF and it stops matching, so anyone can see the difference in seconds."
        />
      </div>
    </section>
  );
}

/** "Four answers. Two promises." with the cube. */
export function Answers() {
  return (
    <section
      id="answers"
      className="cc-on-dark relative overflow-hidden bg-cc-ink px-16 py-[140px] text-cc-on-dark max-[980px]:px-6 max-[560px]:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-[200px] -mt-[450px] size-[900px] rounded-full bg-[radial-gradient(circle,rgba(240,185,11,0.5),transparent_62%)]"
      />
      <AnswersCube />
    </section>
  );
}

/** "From the registrar to the employer, in four steps." The line fills on scroll. */
export function Steps() {
  return (
    <section
      id="cc-steps"
      className="bg-white px-16 pt-[150px] pb-[140px] max-[980px]:px-6 max-[560px]:pt-24 max-[560px]:pb-20"
    >
      <h2 className="font-disp m-0 max-w-[860px] text-[clamp(40px,4.6vw,72px)] leading-none">
        From the registrar to the employer, in four steps.
      </h2>
      <p className="mt-4 mb-0 max-w-[540px] text-[19px] leading-[1.55] text-cc-muted">
        Every credential follows the same path, and anyone can check where it ends up.
      </p>
      <StepsRow />
    </section>
  );
}

/** Closing call to action and footer, with a cursor glow. */
export function Closing() {
  return (
    <Spotlight className="overflow-hidden bg-cc-yellow px-16 pt-[160px] pb-10 text-cc-ink max-[980px]:px-6 max-[560px]:pt-24">
      <h2 className="font-disp relative m-0 max-w-[1300px] text-[clamp(56px,10.5vw,160px)] leading-[0.9]">
        Check a document.
      </h2>
      <div className="relative mt-[60px] flex flex-wrap items-center justify-between gap-[30px]">
        <p className="m-0 max-w-[500px] text-[21px] leading-normal text-[#1F1700]">
          No account. No emails to the registrar. Drop in the PDF and see the answer.
        </p>
        <Link
          href="/verify"
          className={buttonVariants({ variant: "ink", size: "pill-lg", className: "px-10 text-xl" })}
        >
          Verify a document
        </Link>
      </div>
      <div className="relative mt-[130px] flex flex-wrap justify-between gap-3 border-t border-cc-ink/25 pt-7 text-[15px] text-[#1F1700] max-[560px]:mt-20">
        <span>CampusCred. Team Conexus.</span>
        <span>Batangas State University. BNB Smart Chain Testnet. Sample data only.</span>
      </div>
    </Spotlight>
  );
}
