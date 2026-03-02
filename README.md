# TaxTools.Tax Monitor Pro

$1 taxpayer tools store that generates revenue and routes taxpayers to https://taxmonitor.pro for representation/monitoring.

## Repo Structure (Minimal)

/
├─ _redirects
├─ README.md
├─ MARKET.md
├─ build.mjs
├─ index.html
├─ support.html
├─ tools.html
├─ about.html
├─ faq.html
├─ help-center.html
├─ legal/
│  ├─ privacy.html
│  ├─ refund.html
│  └─ terms.html
├─ assets/
│  ├─ favicon.ico
│  └─ logo.svg
├─ partials/
│  ├─ footer.html
│  └─ header.html
├─ robots.txt
├─ sitemap.xml
├─ scripts/
│  └─ site.js
├─ styles/
│  └─ site.css
└─ _sdk/
   ├─ data_sdk.js
   └─ element_sdk.js

## Progress (Pro-Way)

### Step 1 — Lock API Contract (Blocker until complete)

Endpoints (canonical):
- GET  https://tools-api.taxmonitor.pro/v1/checkout/status?session_id=
- POST https://tools-api.taxmonitor.pro/v1/checkout/sessions
- POST https://tools-api.taxmonitor.pro/v1/support/tickets
- POST https://tools-api.taxmonitor.pro/v1/webhooks/stripe

Status:
- [ ] Contracts written (request/response, errors)
- [ ] Frontend matches contracts (index.html + tools.html)
- [ ] Versioning decided (v1 frozen once Stripe is live)

#### Contract: POST /v1/checkout/sessions

Request (application/json):
{
  "cancelUrl": "string",
  "items": [
    { "id": "string", "name": "string", "price": 1, "quantity": 1 }
  ],
  "successUrl": "string",
  "total": 1
}

Response (200 application/json):
{
  "checkoutUrl": "string",
  "sessionId": "string"
}

Errors:
- 400 { "error": "string" }
- 500 { "error": "string" }

#### Contract: GET /v1/checkout/status?session_id=

Response (200 application/json):
{
  "sessionId": "string",
  "status": "paid|pending|failed",
  "updatedAt": "ISO-8601 string"
}

Errors:
- 404 { "error": "string" }
- 500 { "error": "string" }

#### Contract: POST /v1/webhooks/stripe

Headers:
- Stripe-Signature: string (required)

Response:
- 200 { "ok": true }

Notes:
- Must be idempotent per Stripe event id.

#### Contract: POST /v1/support/tickets

Request (application/json):
{
  "email": "string",
  "message": "string",
  "name": "string (optional)",
  "subject": "string (optional)"
}

Response (200 application/json):
{
  "ticketId": "string"
}

Errors:
- 400 { "error": "string" }
- 500 { "error": "string" }

### Step 2 — Worker Skeleton (Stubs)

Status:
- [ ] Worker created
- [ ] Routes exist
- [ ] Contracts return stub responses

### Step 3 — Stripe Checkout (Real)

Status:
- [ ] Stripe product/price strategy decided (or hard-coded $1 items)
- [ ] /v1/checkout/sessions returns real checkoutUrl
- [ ] Success + cancel URLs behave

### Step 4 — Webhook → R2 → Email Receipt (Real)

Status:
- [ ] Webhook signature validation
- [ ] Receipt storage (R2)
- [ ] Download link email (Google Workspace)
- [ ] Idempotency implemented

### Step 5 — UI Hardening

Status:
- [ ] tools.html catalog page live
- [ ] support.html posts to /v1/support/tickets
- [ ] Legal pages live
- [ ] sitemap.xml + robots.txt verified
- [ ] 404 behavior verified

## Build & Deploy

Build:
- npm run build (or node build.mjs)

Deploy:
- Cloudflare Pages (static)
- Cloudflare Worker (tools-api)

## Non-Goals (Launch)

- Multiple payment processors
- User accounts
- Complex licensing DRM
