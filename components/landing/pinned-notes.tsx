"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { StatusPill, type PillStatus } from "@/components/brand/status-pill";

type NoteDef = {
  id: "a" | "b" | "c" | "d";
  /** Desktop position. The left edge never comes closer than 680px, so the headline, paragraph and buttons stay clear. */
  left: string;
  top: number;
  width: number;
  rotate: number;
  floatDelay: number;
  enterDelay: number;
} & ({ kind: "note"; status: PillStatus; title: string; body: string; meta: string } | { kind: "compose" });

const NOTES: NoteDef[] = [
  {
    id: "a",
    left: "max(calc(100% - 380px), 680px)",
    top: 150,
    width: 290,
    rotate: 3,
    floatDelay: 0,
    enterDelay: 1.3,
    kind: "note",
    status: "valid",
    title: "Certificate of Enrollment",
    body: "Issued by BatStateU Registrar on 5 Nov 2026.",
    meta: "Checked on BNB Smart Chain",
  },
  {
    id: "b",
    left: "max(calc(100% - 640px), 680px)",
    top: 330,
    width: 270,
    rotate: -4,
    floatDelay: 1.2,
    enterDelay: 1.5,
    kind: "note",
    status: "tampered",
    title: "Certificate of Grades",
    body: "The grade was changed from 1.75 to 1.25 after it was issued.",
    meta: "Fingerprint does not match",
  },
  {
    id: "c",
    left: "max(calc(100% - 340px), 680px)",
    top: 430,
    width: 280,
    rotate: 2.5,
    floatDelay: 0.6,
    enterDelay: 1.7,
    kind: "compose",
  },
  {
    id: "d",
    left: "max(calc(100% - 700px), 680px)",
    top: 600,
    width: 260,
    rotate: 2,
    floatDelay: 2,
    enterDelay: 1.9,
    kind: "note",
    status: "revoked",
    title: "Certificate of Good Moral",
    body: "Withdrawn by the registrar. Reason: issued in error.",
    meta: "Revocation is public",
  },
];

const PHRASES: { text: string; verdict: PillStatus }[] = [
  { text: "Diploma-final.pdf", verdict: "valid" },
  { text: "Transcript-of-Records.pdf", verdict: "tampered" },
  { text: "scan_0042.pdf", verdict: "not_found" },
];
const HOLD = 32;
const TICK_MS = 55;

/** Typed filename and verdict for the "Check a PDF" note at a given tick (prototype typedAt). */
function typedAt(tick: number): { text: string; verdict: PillStatus | null } {
  const segs = PHRASES.map((p) => ({ p, len: p.text.length + HOLD + Math.ceil(p.text.length / 2) + 8 }));
  const total = segs.reduce((n, s) => n + s.len, 0);
  let k = tick % total;
  for (const { p, len } of segs) {
    if (k < len) {
      const typeT = p.text.length;
      const del = Math.ceil(p.text.length / 2);
      if (k < typeT) return { text: p.text.slice(0, k), verdict: null };
      if (k < typeT + HOLD) return { text: p.text, verdict: p.verdict };
      if (k < typeT + HOLD + del)
        return { text: p.text.slice(0, Math.max(0, p.text.length - (k - typeT - HOLD) * 2)), verdict: null };
      return { text: "", verdict: null };
    }
    k -= len;
  }
  return { text: "", verdict: null };
}

type Offset = { dx: number; dy: number };

/**
 * Four draggable pinned notes on the hero (decoration: aria-hidden). Pointer capture keeps a drag
 * on its note; touch-action none stops the page scrolling under a finger. The compose note types
 * filenames while it is on screen; under reduced motion it shows one finished example.
 */
export function PinnedNotes() {
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Type only while the notes are visible and motion is allowed.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer) timer = setInterval(() => setTick((t) => t + 1), TICK_MS);
      if (!entry.isIntersecting && timer) {
        clearInterval(timer);
        timer = undefined;
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [reduced]);

  const typed = reduced ? { text: PHRASES[0].text, verdict: PHRASES[0].verdict } : typedAt(tick);

  function down(id: string, e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const o = offsets[id] ?? { dx: 0, dy: 0 };
    drag.current = { id, sx: e.clientX, sy: e.clientY, ox: o.dx, oy: o.dy };
    setDragId(id);
  }
  function move(id: string, e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== id) return;
    setOffsets((prev) => ({ ...prev, [id]: { dx: d.ox + e.clientX - d.sx, dy: d.oy + e.clientY - d.sy } }));
  }
  function up() {
    drag.current = null;
    setDragId(null);
  }

  return (
    <div ref={rootRef} aria-hidden="true" className="cc-land-notes pointer-events-none absolute inset-0 z-4">
      {NOTES.map((n) => {
        const o = offsets[n.id] ?? { dx: 0, dy: 0 };
        const dragging = dragId === n.id;
        const style = {
          "--l": n.left,
          "--t": `${n.top}px`,
          width: n.width,
          zIndex: dragging ? 9 : undefined,
          transform: `translate(${o.dx}px, ${o.dy}px) rotate(${n.rotate}deg)`,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.2, 1)",
          cursor: dragging ? "grabbing" : "grab",
          animationDelay: `${n.enterDelay}s`,
        } as CSSProperties;
        return (
          <div
            key={n.id}
            data-topo-ignore
            className={`cc-land-note cc-land-note-${n.id} pointer-events-auto max-w-[calc(100vw-48px)]`}
            style={style}
            onPointerDown={(e) => down(n.id, e)}
            onPointerMove={(e) => move(n.id, e)}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <div className="cc-land-note-in" style={{ "--d": `${n.floatDelay}s` } as CSSProperties}>
              <i className="cc-land-pin" />
              {n.kind === "note" ? (
                <>
                  <StatusPill status={n.status} />
                  <h4 className="font-disp mt-[11px] mb-1 text-lg leading-[1.25] tracking-[-0.02em]">{n.title}</h4>
                  <p className="m-0 text-sm leading-[1.45] text-cc-muted">{n.body}</p>
                  <div className="mt-[11px] text-[13px] text-cc-muted-2">{n.meta}</div>
                </>
              ) : (
                <>
                  <h4 className="font-disp mt-1 mb-0 text-lg leading-[1.25] tracking-[-0.02em]">Check a PDF</h4>
                  <div className="mt-2.5 flex min-h-11 items-center rounded-[10px] border-[1.5px] border-[#E7E2CF] px-3 py-2.5 text-sm leading-[1.4]">
                    {typed.text}
                    <span className="cc-land-caret" />
                  </div>
                  <div className="mt-2.5 min-h-7">{typed.verdict && <StatusPill status={typed.verdict} />}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
