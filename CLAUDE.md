# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

CampusCred is a fresh `create-next-app` scaffold (single commit). `app/page.tsx` is still the default template; no domain code, data layer, or tests exist yet.

## Commands

Package manager is **bun** (`packageManager: bun@1.3.14`, `bun.lock`). Use `bun`, not npm/yarn/pnpm.

- `bun install`
- `bun dev`: dev server on http://localhost:3000 (Turbopack)
- `bun run build` / `bun start`
- `bun run lint`: ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)
- Type check: `bunx tsc --noEmit`

No test runner is configured.

## Stack and non-obvious config

- **Next.js 16.4 / React 19.3, App Router only** (`app/`). Per AGENTS.md, APIs differ from older Next.js. Read the docs bundled at `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …) before writing Next-specific code.
- `next.config.ts` enables:
  - `cacheComponents: true`: Cache Components model (`"use cache"`, dynamic-by-default rendering). Check the bundled docs for caching/data-fetching semantics before writing data access.
  - `partialPrefetching: true` and `experimental.agentFeedback: true`.
  - Tailwind is wired through a **Turbopack loader rule** (`@tailwindcss/turbopack` on `*.css`), not PostCSS. There is no `postcss.config` or `tailwind.config`, so don't add one.
- **Tailwind v4**, CSS-first config: theme tokens live in `app/globals.css` via `@theme inline` (`--color-background`, `--color-foreground`, Geist font vars). Dark mode uses `prefers-color-scheme`.
- Root layout uses global typed `LayoutProps<"/">` (generated route types; no import needed).
- Path alias `@/*` maps to the repo root.
