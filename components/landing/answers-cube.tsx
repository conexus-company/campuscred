"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ROWS = [
  { name: "Valid", text: "The fingerprint matches an active credential.", dot: "var(--cc-valid-dark)" },
  { name: "Revoked", text: "The registrar withdrew it. The reason stays visible.", dot: "var(--cc-revoked-dark)" },
  { name: "Tampered", text: "The file was changed after it was issued.", dot: "var(--cc-tampered-dark)" },
  { name: "Not found", text: "No record exists for this fingerprint.", dot: "var(--cc-notfound-dark)" },
  { name: "Private by design", text: "Names, student numbers and the PDF never touch the chain." },
  { name: "Cannot be transferred", text: "A credential stays with its student and cannot be sold." },
];

/** Cube rotation that brings each face to the front, in row order. */
const TARGETS = [
  { x: -8, y: 0 },
  { x: -8, y: -90 },
  { x: -8, y: -180 },
  { x: -8, y: 90 },
  { x: -90, y: 0 },
  { x: 90, y: 0 },
];

/**
 * "Four answers. Two promises." rows plus the cube. The cube auto-rotates, tilts toward the
 * pointer and turns to the hovered or focused row. Paused off screen; still under reduced motion.
 */
export function AnswersCube() {
  const [active, setActive] = useState<number | null>(null);
  const selected = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const cube = cubeRef.current;
    if (!stage || !cube) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur = { x: -14, y: -25 };
    const tilt = { x: 0, y: 0 };
    const tiltTarget = { x: 0, y: 0 };
    let raf = 0;
    let onScreen = false;

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      tiltTarget.y = ((e.clientX - r.left) / r.width - 0.5) * 18;
      tiltTarget.x = -((e.clientY - r.top) / r.height - 0.5) * 14;
    };
    const onLeave = () => {
      tiltTarget.x = 0;
      tiltTarget.y = 0;
    };

    const frame = (t: number) => {
      raf = 0;
      const sel = selected.current;
      if (sel !== null) {
        const tg = TARGETS[sel];
        const dy = ((((tg.y - cur.y) % 360) + 540) % 360) - 180;
        cur.y += dy * (reduce ? 1 : 0.09);
        cur.x += (tg.x - cur.x) * (reduce ? 1 : 0.09);
      } else if (!reduce) {
        cur.y += 0.28;
        cur.x += (-16 + Math.sin(t / 1600) * 7 - cur.x) * 0.04;
      }
      if (!reduce) {
        tilt.x += (tiltTarget.x - tilt.x) * 0.08;
        tilt.y += (tiltTarget.y - tilt.y) * 0.08;
      }
      cube.style.transform = `rotateX(${cur.x + tilt.x}deg) rotateY(${cur.y + tilt.y}deg)`;
      if (onScreen && !reduce) raf = requestAnimationFrame(frame);
    };
    // Under reduced motion, draw once per selection change instead of looping.
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) kick();
    });
    observer.observe(stage);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("cc-land-select", kick);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("cc-land-select", kick);
    };
  }, []);

  function select(i: number | null) {
    selected.current = i;
    setActive(i);
    stageRef.current?.dispatchEvent(new Event("cc-land-select"));
  }

  return (
    <div className="relative grid grid-cols-[1fr_560px] items-center gap-[60px] max-[980px]:grid-cols-1">
      <div>
        <h2 className="font-disp m-0 max-w-[620px] text-[clamp(40px,4.6vw,72px)] leading-none">
          Four answers. Two promises.
        </h2>
        <p className="mt-[18px] mb-0 max-w-[520px] text-[19px] leading-[1.55] text-[#E8DDB0]">
          Every check ends in one of four answers, and every credential keeps two promises. Hover a row to turn the
          cube.
        </p>
        <ul className="m-0 mt-11 list-none border-t border-white/16 p-0">
          {ROWS.map((r, i) => (
            <li key={r.name}>
              <button
                type="button"
                aria-pressed={active === i}
                onPointerEnter={() => select(i)}
                onPointerLeave={() => select(null)}
                onFocus={() => select(i)}
                onBlur={() => select(null)}
                className={cn(
                  "flex w-full items-baseline justify-between gap-5 border-b border-white/16 py-5 text-left transition-[opacity,padding] duration-400 ease-[cubic-bezier(.2,.9,.2,1)] max-[560px]:flex-col max-[560px]:gap-1.5",
                  active === i ? "pl-4 opacity-100" : "pl-0 opacity-60",
                )}
              >
                <span className="font-disp inline-flex items-baseline gap-3 text-[36px] max-[560px]:text-[28px]">
                  {r.dot && (
                    <i
                      aria-hidden="true"
                      className="block size-3 shrink-0 self-center rounded-full"
                      style={{ background: r.dot }}
                    />
                  )}
                  {r.name}
                </span>
                <span className="max-w-[290px] text-right text-[15.5px] text-[#F0E8C8] max-[560px]:max-w-none max-[560px]:text-left">
                  {r.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={stageRef}
        aria-hidden="true"
        className="cc-land-stage relative grid h-[560px] place-items-center [perspective:1500px]"
      >
        <div className="cc-land-cube-scale">
          <div ref={cubeRef} className="relative size-[380px] [transform-style:preserve-3d]">
            <Face
              cls="cc-land-f0 is-gold"
              kind="Answer"
              title="Valid"
              text="The fingerprint matches an active credential."
            />
            <Face
              cls="cc-land-f1"
              kind="Answer"
              title="Revoked"
              color="#FB923C"
              text="The registrar withdrew it. The reason stays visible."
            />
            <Face
              cls="cc-land-f2"
              kind="Answer"
              title="Tampered"
              color="#F87171"
              text="The file was changed after it was issued."
            />
            <Face
              cls="cc-land-f3"
              kind="Answer"
              title="Not found"
              color="#D4D4D8"
              text="No record exists for this fingerprint."
            />
            <Face
              cls="cc-land-f4"
              kind="Promise"
              title="Private by design"
              text="Names, student numbers and the PDF never touch the chain."
            />
            <Face
              cls="cc-land-f5"
              kind="Promise"
              title="Cannot be transferred"
              text="A credential stays with its student and cannot be sold."
            />
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 -ml-[150px] h-10 w-[300px] rounded-[50%] bg-[radial-gradient(ellipse,rgba(0,0,0,0.7),transparent_70%)] blur-[6px]" />
      </div>
    </div>
  );
}

function Face({
  cls,
  kind,
  title,
  text,
  color,
}: {
  cls: string;
  kind: string;
  title: string;
  text: string;
  color?: string;
}) {
  return (
    <div className={`cc-land-face ${cls}`}>
      <small>{kind}</small>
      <div>
        <b style={color ? { color } : undefined}>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  );
}
