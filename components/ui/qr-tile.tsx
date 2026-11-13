import { create } from "qrcode";
import { cn } from "@/lib/utils";

type QrTileProps = {
  /** The text to encode, usually `${NEXT_PUBLIC_SITE_URL}/v/${slug}`. */
  value: string;
  /** Rendered edge length in px, tile padding included. */
  size?: number;
  /** Accessible name. Defaults to "QR code for <value>". */
  label?: string;
  className?: string;
};

const QUIET = 4; // standard 4-module quiet zone, drawn inside the tile

/**
 * Real QR code (qrcode package) drawn as one SVG path on a white tile with a
 * quiet zone. Synchronous, so it renders on the server and the client.
 */
export function QrTile({ value, size = 220, label, className }: QrTileProps) {
  const { modules } = create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const dim = n + QUIET * 2;

  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules.data[r * n + c]) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`;
    }
  }

  return (
    <div
      className={cn("rounded-[20px] border-[3px] aspect-square border-cc-ink bg-white p-1.5", className)}
      style={{ width: size, maxWidth: "100%" }}
    >
      <svg
        role="img"
        aria-label={label ?? `QR code for ${value}`}
        viewBox={`0 0 ${dim} ${dim}`}
        shapeRendering="crispEdges"
        className="block size-full"
      >
        <rect width={dim} height={dim} fill="#fff" />
        <path d={d} fill="#0B0B0C" />
      </svg>
    </div>
  );
}
