# taxtools.taxmonitor.pro — Claude Context

## Role of This Repo
FRONTEND ONLY after migration. No backend logic lives here.
All API calls go to https://api.virtuallaunch.pro

## Migration Status
Phase T1: ✅ Repo cleanup (complete)
Phase T2: ❌ Build 13 missing routes in VLP
Phase T3: ✅ Next.js scaffold complete (2026-03-29)
Phase T4a: ✅ Functional pages complete
Phase T4b: ✅ Content pages complete
Phase T5: ✅ Legacy Worker deleted from repo (2026-03-29)
Phase T6: ⏳ Delete D1 database — manual step in Cloudflare dashboard (see instructions below)

## Hard Rules
- Never create a new Worker in this repo
- Never add backend logic to this repo
- Never add PayPal integration (removed — using Stripe)
- Never add ClickUp integration (removed)
- All fetch() calls must go to https://api.virtuallaunch.pro
- The workers/ directory has been deleted (T5 complete)

## VLP API Base URL
https://api.virtuallaunch.pro

## Route Mapping (Legacy → VLP)
/v1/auth/start              → /v1/auth/magic-link/request
/v1/auth/complete           → /v1/auth/magic-link/verify
/v1/auth/me                 → /v1/auth/session
/v1/auth/logout             → /v1/auth/logout
/v1/checkout/sessions       → /v1/checkout/sessions (Stripe)
/v1/checkout/status         → /v1/checkout/status
/v1/games/access            → /v1/games/access
/v1/games/end               → /v1/games/end
/v1/help/tickets            → /v1/support/tickets
/v1/help/status             → /v1/support/tickets/{ticket_id}
/v1/tokens/balance          → /v1/tokens/balance/{account_id}
/v1/tokens/spend            → /v1/tokens/consume
/v1/webhooks/paypal         → REMOVED (PayPal deleted)

## Frontend Architecture
Next.js 15 (App Router) + TypeScript + CSS Modules.
API client lives in lib/api.ts — never hardcode the
base URL elsewhere. Design tokens in app/globals.css.
Games remain as static HTML in public/games/.
## Cleanup Completed (Phase T1)
- PayPal: removed from Worker, HTML, and all config
- ClickUp: removed from Worker and all config
- Dead code: _sdk stubs replaced with real implementations
- .claude: configured

## Cleanup Completed (Phase T5)
- Legacy Worker (workers/) deleted from repo
- Legacy HTML files deleted (index, login, contact, about, faq, help-center)
- Legacy directories deleted (legal/, partials/, styles/, _sdk/, assets/, scripts/, about-games/, games/)
- Token cost fixed: all games set to 1 token per play

## Manual Steps Remaining

### Delete TTTMP Legacy Worker from Cloudflare
1. Go to Cloudflare Dashboard → Workers & Pages
2. Find: taxtools-taxmonitor-pro-api
3. Click Settings → scroll to bottom → Delete Worker
4. Confirm deletion

### Delete TTTMP D1 Database from Cloudflare
1. Go to Cloudflare Dashboard → Workers & Pages → D1
2. Find: tax-tools-tax-monitor
   ID: e43ad11a-dd66-42fc-b162-b96a7295a079
3. Delete the database (test data only — safe to delete)
4. Also remove the D1 binding from workers/api/wrangler.toml
   (already deleted in T5, so this is already done)
