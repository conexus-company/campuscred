# Frontend guide

How to build screens in CampusCred: design tokens, the shared shell and components, and the mock chain switch. Gil owns these files (see `pr-gil.md` 3.3). Alvin's issuer and admin screens use them too.

## Run it

```bash
bun install
bun dev            # http://localhost:3000
bun test           # unit tests
bun run lint && bunx tsc --noEmit && bun run build
```

`/dev/components` shows every shared component with sample data. Use it when you need to check a component in isolation.

## Design tokens

Tokens live in `app/globals.css`. Values are defined as CSS variables on `:root` (`--cc-*`) and exposed to Tailwind through `@theme inline` (`--color-cc-*`), so `bg-cc-yellow` and `var(--cc-yellow)` mean the same thing. The theme is light only: the `dark:` variant is tied to a `.dark` class that never gets set.

| Token | Value | Use |
|---|---|---|
| `cc-yellow` | `#F0B90B` | Brand accent, primary pills, focus on dark surfaces |
| `cc-ink` | `#0B0B0C` | Text, ink buttons, focus outline on light surfaces |
| `cc-side` | `#14110A` | Sidebar and dark banners |
| `cc-page` | `#FBF8EC` | Page background |
| `cc-paper` / `cc-butter` | `#FBFAF4` / `#FBF4D2` | Quiet panels / highlighted notes |
| `cc-line` / `cc-track` | `#EAE3C8` / `#F1EBD3` | Borders / progress tracks |
| `cc-muted` / `cc-muted-2` | `#5F5640` / `#6E6549` | Secondary text (both pass 4.5:1 on `cc-page`) |
| `cc-on-dark` / `cc-on-dark-muted` | `#FFF6D9` / `#D9CFA6` | Text on `cc-side` |
| `cc-valid` `cc-revoked` `cc-tampered` `cc-notfound` | green / amber / red / grey | Status dots, on light surfaces |
| `cc-*-dark` variants | brighter | Status dots and words on dark surfaces |

Fonts come from `next/font` in `app/layout.tsx`: Inter (body, `font-sans`), Poppins (display, use the `font-disp` utility for big headings), Lora (`font-serif`), and the system mono stack (`font-mono`, for hashes and addresses).

Radii: `rounded-card` (24px), `rounded-banner` (32px), `rounded-input` (14px).

Motion utilities: `cc-in`, `cc-fill`, `cc-float`. Every animation must respect `prefers-reduced-motion`. Use Tailwind's `motion-reduce:` variant, or `useReducedMotion()` from `components/brand/use-reduced-motion.ts` in JS.

## Rules every screen follows

- **360px:** no horizontal scroll at 360px wide. Long hashes and addresses use `break-all` (`HashText` already does).
- **Focus:** keyboard focus is always visible. Light surfaces get a 3px `cc-ink` outline, and anything inside `.cc-on-dark` gets a yellow one. Buttons from `components/ui/button.tsx` already handle this.
- **Status is never colour alone:** always use `StatusPill` (a dot plus a word), or a word next to the colour.
- **Icon-only controls** need an `aria-label`. Decorative icons get `aria-hidden="true"`.
- **Privacy (3.8):** verify screens and `/api/verify/*` never show a student name, number or email.

## Shell and layout

| Component | File | Use |
|---|---|---|
| `SiteNav` | `components/shell/site-nav.tsx` | Public pages (landing, verify). Props: `links`, `actions` |
| `AppShell` | `components/shell/app-shell.tsx` | Signed-in screens (student, issuer, admin). The dark sidebar becomes a top bar below 980px |
| `PageBanner` | `components/shell/page-banner.tsx` | Big rounded title block. `tone="dark"` for app screens, `"yellow"` for public pages |

```tsx
<AppShell
  nav={[{ href: "/student", label: "My credentials", icon: <FileCheck2 /> }]}
  identity={{ title: student.fullName, subtitle: "Student" }}
  footerLink={{ label: "Disconnect", href: "/" }}   // a plain link, or:
  footer={<form action={signOut}><button className={APP_SHELL_FOOTER_LINK}>Sign out</button></form>}
>
  <PageBanner title="My credentials" subtitle="…" />
  …
</AppShell>
```

Use `footer` with a form for anything that changes state, like signing out. Next prefetches links, so a sign-out link could fire on its own. Import `APP_SHELL_FOOTER_LINK` from `components/shell/app-shell-styles.ts`, not from `app-shell.tsx`: that file is a client module, so in a Server Component you would get a client reference instead of the class string.

## Shared components

| Component | File | Notes |
|---|---|---|
| `Button`, `buttonVariants` | `components/ui/button.tsx` | Pill variants `ink`, `yellow`, `ink-outline` with sizes `pill-sm`, `pill`, `pill-lg`. Use `buttonVariants()` to style a `<Link>` as a button |
| `StatusPill` | `components/brand/status-pill.tsx` | `valid`, `revoked`, `tampered`, `not_found`, `active`, `pending`, `match` |
| `HashText` | `components/brand/hash-text.tsx` | Mono hash with the first 10 characters highlighted. `short` for lists, `scramble` for the decrypt effect |
| `QrTile` | `components/ui/qr-tile.tsx` | Real QR code (`qrcode` package) drawn as SVG. Works on the server and the client |
| `DropZone` | `components/ui/drop-zone.tsx` | PDF picker for verify and issue |
| `TabsPill` | `components/ui/tabs-pill.tsx` | Segmented control (`options`, `value`, `onChange`, `label`) |
| `Timeline` | `components/ui/timeline.tsx` | Issued and revoked history |
| `Logo`, `LogoMark` | `components/brand/logo.tsx` | `tone="ink"` or `"yellow"` |
| `Card` | `components/ui/card.tsx` | shadcn card on CampusCred tokens |

Formatting helpers are in `lib/format.ts`: `formatDate` (always in Asia/Manila), `shortHash`, `shortAddress`, `credTypeLabel` and `revokeReasonText`.

## Mock chain on and off

`NEXT_PUBLIC_USE_MOCK_CHAIN` in `.env.local` decides where verify data comes from.

| Value | Chain reads (`lib/chain/read.ts`) | Share-link metadata (`lib/verify/slug-meta.ts`) |
|---|---|---|
| `true` | `lib/chain/mock.ts` fixtures | `lib/verify/mock-slugs.ts` fixtures |
| `false` | BSC Testnet through `NEXT_PUBLIC_RPC_URL_PRIMARY`, then the fallback RPC | Supabase `credentials` table |

To switch, change the value and **restart `bun dev`**. `NEXT_PUBLIC_*` values are baked in when the server starts.

With the mock on:

- `/verify`: upload `public/samples/sample-valid.pdf` for Valid, `sample-revoked.pdf` for Revoked, and any other PDF for Not found.
- `/v/k7Qm2xVa9P` shows Valid. Uploading an edited copy of `sample-valid.pdf` there shows Tampered.
- `/v/r3Td8wLc5N` shows Revoked. `/v/p9Hs4yBe2J` is a private credential, so it shows Not found.

The student wallet (`/student`) always reads Supabase, whatever the flag says. The seeded demo students come from `bun scripts/seed-students.ts`. Their password is `DEMO_STUDENT_PASSWORD`.

Issuer names on the verify screens come from Alvin's `GET /api/issuers`. Until that route exists, the browser logs a 404 for it and the screens fall back to the sample name in `lib/verify/issuers.ts`.
