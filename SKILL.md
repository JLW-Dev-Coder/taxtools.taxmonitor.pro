# SKILL.md — taxtools.taxmonitor.pro

Last updated: 2026-04-04

---

## Purpose

No batch generation skills live in this repo. TTTMP is frontend-only.

All skills (batch generation, prospect processing, asset page creation) are owned by:
- `C:\Users\eimaj\transcript.taxmonitor.pro` (TTMP SCALE)
- `C:\Users\eimaj\virtuallaunch.pro` (VLP SCALE)

## Frontend Skills

### Build & Deploy
- **Build:** `npm run build` — Next.js static export
- **Dev:** `npm run dev` — local development server
- **Deploy:** Push to main → Cloudflare Pages auto-deploy

### Page Creation
- Pages follow Next.js App Router conventions
- Each page: `app/{route}/page.tsx` + `page.module.css`
- Shared components in `components/`
- API calls via `lib/api.ts` — never hardcode base URL

### Game Integration
- Game metadata in `lib/games.ts`
- Static HTML games in `public/games/`
- Game detail pages at `/about-games/[slug]`
- Token gating via API: `grantAccess()` → `verifyAccess()` → `endGame()`
