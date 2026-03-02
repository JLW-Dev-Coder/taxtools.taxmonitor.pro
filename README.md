# TaxTools.Tax Monitor Pro

A small, conversion-focused $1 taxpayer tools store that routes users to `taxmonitor.pro` for representation/monitoring.

## Answers to dependency questions

* Worker code location: **Yes**. `workers/api/` (in this repo).
* Worker name (Wrangler `name`): **taxtools-taxmonitor-pro-api**.
* Worker route: **Yes**. `tools-api.taxmonitor.pro/*`.

## Domains

* Site: `https://taxtools.taxmonitor.pro` (static site)
* Tools API: `https://tools-api.taxmonitor.pro` (Cloudflare Worker)

## Repo structure

```text
/
├─ _redirects
├─ README.md
├─ build.mjs
├─ index.html
├─ support.html
├─ assets/
│  ├─ favicon.ico
│  └─ logo.svg
├─ legal/
│  ├─ privacy.html
│  ├─ refund.html
│  └─ terms.html
├─ partials/
│  ├─ footer.html
│  └─ header.html
├─ scripts/
│  └─ site.js
├─ styles/
│  └─ site.css
├─ _sdk/
│  ├─ data_sdk.js
│  └─ element_sdk.js
└─ workers/
   └─ api/
      ├─ wrangler.toml
      └─ src/
         └─ index.js
```

## Pages

* About: `/about.html`
* Contact: `/support.html`
* FAQ: `/faq.html`
* Help Center: `/help-center.html`
* Home: `/index.html`
* Tools: `/tools.html`

### Legal pages

* Privacy Policy: `/legal/privacy.html`
* Refund Policy: `/legal/refund.html`
* Terms of Service: `/legal/terms.html`

## API contract

Base: `https://tools-api.taxmonitor.pro`

### Endpoints

* `GET  /v1/checkout/status?session_id=`
* `POST /v1/checkout/sessions`
* `POST /v1/support/tickets`
* `POST /v1/webhooks/stripe`

### Status endpoint rule

* Status endpoint must be the exact URL form: `https://tools-api.taxmonitor.pro/...`

### UI references

`index.html` currently references:

* `POST https://tools-api.taxmonitor.pro/v1/checkout/sessions`
* `GET  https://tools-api.taxmonitor.pro/v1/checkout/status?session_id=` (planned)
* `POST https://tools-api.taxmonitor.pro/v1/support/tickets` (planned)

## Build plan

### Step 1 — Lock API contract

Define exact request/response shapes for all v1 endpoints (no ambiguity).

### Step 2 — Build Worker skeleton

* Routes exist
* Stub JSON responses
* CORS + OPTIONS

### Step 3 — Wire Stripe checkout

Return real `checkoutUrl`.

### Step 4 — Wire webhook → R2 → Gmail receipt

Money + email loop works.

### Step 5 — Build UI around it

UI is already ahead of backend; proceed in vertical slices.

## Progress tracker

* [ ] Add missing pages: `about.html`, `faq.html`, `help-center.html`, `tools.html`
* [ ] Add legal pages: `legal/privacy.html`, `legal/refund.html`, `legal/terms.html`
* [ ] Add Worker skeleton: `workers/api/wrangler.toml`, `workers/api/src/index.js`
* [ ] Deploy Worker on `tools-api.taxmonitor.pro/*`
* [ ] Confirm UI checkout calls return stub JSON
* [ ] Replace stub checkout with real Stripe session

## Operating rule

When a dependency question comes up (routes, folders, contract rules), check this README first. If the answer isn’t here yet, add it here before proceeding.
