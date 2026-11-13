"use client";

import { Camera, ImageUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { slugFromScan } from "@/lib/verify/qr-link";

type Phase = "idle" | "starting" | "scanning" | "opening";

const NOT_OURS = "That QR code isn’t a CampusCred link. Scan the code on the credential, or upload the PDF instead.";

/**
 * Second entry point on /verify: scan a credential's QR code with the camera (or from a photo)
 * and open its /v/[slug] page. html5-qrcode loads only when the verifier asks for it.
 */
export function QrScanner() {
  const router = useRouter();
  const regionId = useId().replace(/:/g, "");
  const scanner = useRef<Html5Qrcode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<Html5Qrcode> {
    if (scanner.current) return scanner.current;
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
    scanner.current = new Html5Qrcode(regionId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    return scanner.current;
  }

  async function stop() {
    const s = scanner.current;
    if (s?.isScanning) await s.stop().catch(() => {});
  }

  function open(text: string): boolean {
    const slug = slugFromScan(text);
    if (!slug) {
      setError(NOT_OURS);
      return false;
    }
    setPhase("opening");
    router.push(`/v/${slug}?via=qr`);
    return true;
  }

  async function startCamera() {
    setError(null);
    setPhase("starting");
    try {
      const s = await load();
      await s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          if (slugFromScan(text)) void stop().then(() => open(text));
          else setError(NOT_OURS);
        },
        () => {},
      );
      setPhase("scanning");
    } catch (err) {
      const name = (err as { name?: string })?.name ?? String(err);
      setError(
        /NotAllowed|Permission/i.test(name)
          ? "Camera access is blocked. Allow the camera in your browser, or choose a photo of the QR code."
          : "No camera is available. Choose a photo of the QR code, or upload the PDF instead.",
      );
      setPhase("idle");
    }
  }

  async function cancel() {
    await stop();
    setPhase("idle");
  }

  async function fromPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    await stop();
    try {
      const s = await load();
      const text = await s.scanFile(file, false);
      if (!open(text)) setPhase("idle");
    } catch {
      setError("We couldn’t find a QR code in that photo. Try a sharper, closer picture.");
      setPhase("idle");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => {
      const s = scanner.current;
      if (s?.isScanning) void s.stop().catch(() => {});
    };
  }, []);

  const live = phase === "starting" || phase === "scanning";

  return (
    <section aria-labelledby={`${regionId}-title`} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={`${regionId}-title`} className="m-0 text-lg font-semibold">
            Have a QR code instead?
          </h2>
          <p className="m-0 text-[15px] text-cc-muted">Scan the code on the credential to open its record.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {live ? (
            <Button variant="ink-outline" size="pill-sm" onClick={cancel}>
              <X aria-hidden="true" />
              Stop camera
            </Button>
          ) : (
            <Button variant="ink" size="pill-sm" onClick={startCamera} disabled={phase === "opening"}>
              <Camera aria-hidden="true" />
              Scan a QR code
            </Button>
          )}
          <Button variant="ink-outline" size="pill-sm" onClick={() => fileRef.current?.click()} disabled={phase === "opening"}>
            <ImageUp aria-hidden="true" />
            Choose a photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => void fromPhoto(e.target.files?.[0])}
          />
        </div>
      </div>

      {/* html5-qrcode renders the camera preview into this element. It must stay mounted. */}
      <div
        id={regionId}
        aria-label={live ? "Camera preview. Point it at the QR code." : undefined}
        className={live ? "mx-auto w-full max-w-[420px] overflow-hidden rounded-[20px] border-[3px] border-cc-ink bg-cc-ink" : "hidden"}
      />

      <p role="status" className="sr-only">
        {phase === "scanning" ? "Camera on. Point it at the QR code." : phase === "opening" ? "QR code found. Opening the record." : ""}
      </p>
      {phase === "opening" && <p className="m-0 text-[15px] font-semibold">QR code found. Opening the record…</p>}
      {error && (
        <p role="alert" className="m-0 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-[15px] leading-[1.5] text-[#991B1B]">
          {error}
        </p>
      )}
    </section>
  );
}
