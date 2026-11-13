import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

function Tag({ children }: { children: ReactNode }) {
  return <span className="font-disp inline-block rounded-md bg-cc-yellow px-3 py-0.5 text-lg">{children}</span>;
}

/** "The problem / The fix". Static here; the scroll-lit words come in gil/05. */
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
        <p className="font-disp m-0 max-w-[1180px] text-[clamp(34px,5vw,76px)] leading-[1.06]">
          Fake diplomas and altered transcripts are hard to catch. To check one, you email the registrar and wait for a
          reply that depends on that office staying reachable and honest.
        </p>
      </div>
      <div className="mt-[120px] grid grid-cols-[260px_1fr] gap-10 max-[980px]:mt-20 max-[980px]:grid-cols-1 max-[980px]:gap-5">
        <div>
          <Tag>The fix</Tag>
        </div>
        <p className="m-0 max-w-[1000px] font-serif text-[clamp(24px,2.5vw,38px)] leading-[1.5]">
          CampusCred records a fingerprint of every credential on BNB Smart Chain. Change a single letter in the PDF and
          it stops matching, so anyone can see the difference in seconds.
        </p>
      </div>
    </section>
  );
}

const ANSWERS = [
  {
    name: "Valid",
    text: "The fingerprint matches an active credential.",
    dot: "var(--cc-valid-dark)",
  },
  {
    name: "Revoked",
    text: "The registrar withdrew it. The reason stays visible.",
    dot: "var(--cc-revoked-dark)",
  },
  {
    name: "Tampered",
    text: "The file was changed after it was issued.",
    dot: "var(--cc-tampered-dark)",
  },
  {
    name: "Not found",
    text: "No record exists for this fingerprint.",
    dot: "var(--cc-notfound-dark)",
  },
  {
    name: "Private by design",
    text: "Names, student numbers and the PDF never touch the chain.",
  },
  {
    name: "Cannot be transferred",
    text: "A credential stays with its student and cannot be sold.",
  },
];

/** "Four answers. Two promises." as a plain list of six rows. The cube comes in gil/05. */
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
      <div className="relative max-w-[760px]">
        <h2 className="font-disp m-0 max-w-[620px] text-[clamp(40px,4.6vw,72px)] leading-none">
          Four answers. Two promises.
        </h2>
        <p className="mt-[18px] mb-0 max-w-[520px] text-[19px] leading-[1.55] text-[#E8DDB0]">
          Every check ends in one of four answers, and every credential keeps two promises.
        </p>
        <ul className="m-0 mt-11 list-none border-t border-white/16 p-0">
          {ANSWERS.map((a) => (
            <li
              key={a.name}
              className="flex items-baseline justify-between gap-5 border-b border-white/16 py-5 max-[560px]:flex-col max-[560px]:gap-1.5"
            >
              <span className="font-disp inline-flex items-baseline gap-3 text-[36px] max-[560px]:text-[28px]">
                {a.dot && (
                  <i
                    aria-hidden="true"
                    className="block size-3 shrink-0 self-center rounded-full"
                    style={{ background: a.dot }}
                  />
                )}
                {a.name}
              </span>
              <span className="max-w-[290px] text-right text-[15.5px] text-[#F0E8C8] max-[560px]:max-w-none max-[560px]:text-left">
                {a.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Issue",
    text: "The registrar uploads the official PDF and signs with a wallet.",
  },
  {
    title: "Fingerprint",
    text: "Only a SHA-256 fingerprint goes on the chain. The PDF stays private.",
  },
  {
    title: "Share",
    text: "The student shares a QR code or link. No wallet needed.",
  },
  { title: "Verify", text: "Anyone checks it in seconds, with no account." },
];

/** "From the registrar to the employer, in four steps." Static; the scroll-filled line comes in gil/05. */
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
      <div className="relative mt-[100px] max-[560px]:mt-14">
        <div
          aria-hidden="true"
          className="absolute top-7 right-0 left-0 h-1 rounded-sm bg-cc-track max-[560px]:hidden"
        />
        <ol className="relative m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-7 p-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative z-1">
              <div className="font-disp grid size-[60px] place-items-center rounded-full border-[3px] border-cc-ink bg-cc-yellow text-[22px] tracking-normal">
                {i + 1}
              </div>
              <b className="font-disp mt-[22px] block text-[26px] tracking-[-0.03em]">{s.title}</b>
              <span className="mt-2 block max-w-[250px] text-[16.5px] leading-[1.5] text-cc-muted">{s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Closing call to action and footer. The cursor glow comes in gil/05. */
export function Closing() {
  return (
    <footer className="overflow-hidden bg-cc-yellow px-16 pt-[160px] pb-10 text-cc-ink max-[980px]:px-6 max-[560px]:pt-24">
      <h2 className="font-disp m-0 max-w-[1300px] text-[clamp(56px,10.5vw,160px)] leading-[0.9]">Check a document.</h2>
      <div className="mt-[60px] flex flex-wrap items-center justify-between gap-[30px]">
        <p className="m-0 max-w-[500px] text-[21px] leading-normal text-[#1F1700]">
          No account. No emails to the registrar. Drop in the PDF and see the answer.
        </p>
        <Link
          href="/verify"
          className={buttonVariants({
            variant: "ink",
            size: "pill-lg",
            className: "px-10 text-xl",
          })}
        >
          Verify a document
        </Link>
      </div>
      <div className="mt-[130px] flex flex-wrap justify-between gap-3 border-t border-cc-ink/25 pt-7 text-[15px] text-[#1F1700] max-[560px]:mt-20">
        <span>CampusCred. Team Conexus.</span>
        <span>Batangas State University. BNB Smart Chain Testnet. Sample data only.</span>
      </div>
    </footer>
  );
}
