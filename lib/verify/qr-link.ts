/** Share slugs: same shape lib/verify/slug-meta.ts accepts. */
const SLUG_RE = /^[A-Za-z0-9_-]{4,64}$/;

/**
 * The share slug inside a scanned QR code, or null if it is not a CampusCred link.
 * Accepts `https://<any host>/v/<slug>` (with or without ?via=qr or a trailing slash).
 * Only the slug is used, and navigation stays on this site, so a QR code pointing at
 * another domain can never redirect the verifier there.
 */
export function slugFromScan(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const match = /^\/v\/([^/]+)\/?$/.exec(url.pathname);
  const slug = match?.[1];
  return slug && SLUG_RE.test(slug) ? slug : null;
}
