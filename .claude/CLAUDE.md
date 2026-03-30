# taxtools.taxmonitor.pro — Claude Context

## Role of This Repo
FRONTEND ONLY after migration. No backend logic lives here.
All API calls go to https://api.virtuallaunch.pro

## Migration Status
Phase T1: 🔄 Repo cleanup (active)
Phase T2: ❌ Build 13 missing routes in VLP
Phase T3: ❌ Centralize frontend into _sdk/
Phase T4: ❌ Update frontend to call VLP API
Phase T5: ❌ Delete legacy Worker from repo and Cloudflare
Phase T6: ❌ Delete D1 database (test data only)

## Hard Rules
- Never create a new Worker in this repo
- Never add backend logic to this repo
- Never add PayPal integration (removed — using Stripe)
- Never add ClickUp integration (removed)
- All fetch() calls must go to https://api.virtuallaunch.pro
- The workers/ directory is scheduled for deletion

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
The _sdk/ directory contains shared API client code.
All HTML files import from _sdk/ instead of having
inline API logic. The API base URL is defined once
in _sdk/api.js only.

## Cleanup Completed (Phase T1)
- PayPal: removed from Worker, HTML, and all config
- ClickUp: removed from Worker and all config
- Dead code: _sdk stubs replaced with real implementations
- .claude: configured
