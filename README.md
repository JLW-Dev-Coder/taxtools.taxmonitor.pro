# README.md — TaxTools.Tax Monitor Pro

A conversion-focused interactive taxpayer games arcade that routes serious users to **https://taxmonitor.pro** for monitoring and representation.

---

# Table of Contents (alphabetical)

- [About-Games Page Standard](#about-games-page-standard)
- [API Contract (v1)](#api-contract-v1)
- [Auth and Cookies](#auth-and-cookies)
- [Auth and Tokens](#auth-and-tokens)
- [Checkout Model (Cartless)](#checkout-model-cartless)
- [Domains and CORS](#domains-and-cors)
- [Game Access Model](#game-access-model)
- [Stripe Webhooks](#stripe-webhooks)
- [Worker Environment Variables](#worker-environment-variables)

---

## About-Games Page Standard

About-games pages are marketing pages that must:

- Contain required sections by `id`:
  - `faq`
  - `how-it-works`
  - `preview`
  - `what-youll-learn`
- Include at least one “unlock” CTA id:
  - `btnUnlock`
  - `btnUnlock2`
- Include at least one “demo” CTA id:
  - `btnDemo`
  - `heroTryDemo`
  - `previewTryDemo`
- Include disclaimers (case-insensitive fragments):
  - `education only`
  - `not representation`
  - `taxmonitor.pro`
- Reference these endpoints (canonical):
  - `GET /v1/auth/me`
  - `GET /v1/tokens/balance`
  - `POST /v1/tokens/spend`

Disallowed endpoint references in pages:

- `/v1/arcade/tokens` (alias exists for compatibility, but pages should use `/v1/tokens/balance`)
- `/v1/tokens` (too vague, enforce `/balance` or `/spend`)

---

## API Contract (v1)

All endpoints are hosted on the API origin:

- Base: `https://tools-api.taxmonitor.pro`

Endpoints (alphabetical by path):

- `GET /health`
- `GET /v1/auth/complete?token=...`
- `GET /v1/auth/me`
- `POST /v1/auth/logout`
- `POST /v1/auth/start`
- `GET /v1/checkout/status?session_id=...`
- `POST /v1/checkout/sessions`
- `GET /v1/games/access?slug=...`
- `GET /v1/help/status?ticket_id=...`
- `POST /v1/help/tickets`
- `GET /v1/tokens/balance`
- `GET /v1/tokens/balance` (alias: `/v1/arcade/tokens`)
- `POST /v1/tokens/spend`
- `POST /v1/webhooks/stripe`

---

## Auth and Cookies

The API uses cookie-based sessions.

Cookies (alphabetical):

- `tm_account_id` (string)
- `tm_email` (string, URL-encoded)
- `tm_session` (opaque session id)

Frontend must call API endpoints using:

- `credentials: "include"`

---

## Auth and Tokens

Token balances are server-authoritative.

Important notes:

- The current Worker implementation is an in-memory store (good for local dev and staging).
- Production should move balances + grants to durable storage (R2/D1/KV), but that is out of scope for “test games now.”

---

## Checkout Model (Cartless)

The UI creates a Stripe Checkout Session via:

- `POST /v1/checkout/sessions`

The Worker maps the requested pack to a Stripe Price ID via env vars.

The Worker sets Stripe Checkout Session metadata:

- `metadata.accountId`
- `metadata.tokens`

The UI should poll:

- `GET /v1/checkout/status?session_id=...`

And then refresh:

- `GET /v1/tokens/balance`

---

## Domains and CORS

Origins (alphabetical):

- API origin: `https://tools-api.taxmonitor.pro`
- Site origin: `https://taxtools.taxmonitor.pro`

Rules:

- Site pages must not call site-host `/v1/*` (no `fetch("/v1/...")` from the site).
- Site pages must call `https://tools-api.taxmonitor.pro/v1/...`.

---

## Game Access Model

Gameplay unlock is a time-bound “grant”.

Flow:

1. `GET /v1/auth/me`
2. `GET /v1/tokens/balance`
3. `POST /v1/tokens/spend` with `{ amount, slug }`
4. Game verifies access with `GET /v1/games/access?slug=...`

Grant policy:

- A successful spend creates a grant for the requested `slug`
- Grant duration: 30 minutes

---

## Stripe Webhooks

Webhook destination:

- `POST /v1/webhooks/stripe`

The Worker verifies:

- `Stripe-Signature` header
- HMAC SHA-256 over `t.payload` using `STRIPE_WEBHOOK_SECRET`

The Worker credits tokens on:

- `checkout.session.completed`

Token credit source of truth:

- `event.data.object.metadata.tokens` (string integer)
- `event.data.object.metadata.accountId` (string)

---

## Worker Environment Variables

Environment vars (alphabetical):

- `ALLOWED_ORIGINS` (optional; comma-separated origins override default allowlist)
- `STRIPE_PRICE_TOKEN_PACK_20`
- `STRIPE_PRICE_TOKEN_PACK_50`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_TOLERANCE_SECONDS` (optional; default 300)
