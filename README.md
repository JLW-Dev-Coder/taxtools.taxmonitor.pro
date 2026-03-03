# TaxTools.Tax Monitor Pro

A small, conversion-focused $1 taxpayer tools store that routes users to `taxmonitor.pro` for representation/monitoring.

---

## Answers to dependency questions

* Worker code location: **Yes**. `workers/api/` (in this repo).
* Worker name (Wrangler `name`): **taxtools-taxmonitor-pro-api**.
* Worker route: **Yes**. `tools-api.taxmonitor.pro/*`.

---

## Domains

* Site: `https://taxtools.taxmonitor.pro` (static site)
* Tools API: `https://tools-api.taxmonitor.pro` (Cloudflare Worker)

---

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

---

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

---

# Products (Stripe v1 Catalog)

All products:

* Price: **$1.00 USD**
* Tax Code: **General – Services (txcd_20030000)**
* Type: One-time purchase
* Status: Active
* Currency: USD

---

## Tax Tools — Tax Deadline Reminder Calendar

* Product ID: `prod_U4qWu36HhPXkBh`
* Price ID: `price_1T6gpHCMpIgwe61ZfbExh6dS`
* Metadata:
  * `item: tax-deadline-reminder-calendar`

Description  
Never miss a tax deadline again. This calendar highlights key federal due dates and keeps your filing season predictable. Use it as a quick-reference planning tool all year.

Marketing Features

* Built for taxpayers and pros
* Clear annual deadline overview
* Easy-to-scan date layout
* Helps prevent late-filing penalties
* Printable and digital-friendly

---

## Tax Tools — Tax Deduction Checklist

* Product ID: `prod_U4qXroMmFZMVzD`
* Price ID: `price_1T6gqhCMpIgwe61ZlZzRCRNs`
* Metadata:
  * `item: tax-deduction-checklist`

Description  
A simple checklist to help you capture common deductions you might otherwise forget. Use it during the year or right before filing to stay organized. Great for W-2 and self-employed taxpayers.

Marketing Features

* Covers common deduction categories
* Easy to save or print
* Fast review before filing
* Helps reduce missed write-offs
* Simple, no-fluff format

---

## Tax Tools — Tax Document Organizer Template

* Product ID: `prod_U4qYc5mcfDfRJF`
* Price ID: `price_1T6grnCMpIgwe61ZdBjCWyBD`
* Metadata:
  * `item: tax-document-organizer-template`

Description  
A clean template to gather and track the documents you need for tax time. It reduces back-and-forth and helps you stay confident you have everything. Works for personal and small business filing.

Marketing Features

* Document checklist by category
* Easy handoff to your tax pro
* Reduces missing-paperwork stress
* Reusable year after year
* Works for personal and business

---

## Tax Tools — Tax Refund Estimator Tool

* Product ID: `prod_U4qZpbqfHO9Ptb`
* Price ID: `price_1T6gsVCMpIgwe61ZoYTVWqhM`
* Metadata:
  * `item: tax-refund-estimator-tool`

Description  
A lightweight estimator to get a ballpark sense of your refund or balance due. It’s built for quick planning, not headaches. Use it to sanity-check expectations before filing.

Marketing Features

* Great for “what-if” planning
* Helps plan cash flow
* Quick refund/balance estimate
* Simple inputs, simple outputs
* Useful before final filing

---

## Tax Tools — Tax Tips Mini E-Book

* Product ID: `prod_U4qa54q2ltPXEZ`
* Price ID: `price_1T6gtbCMpIgwe61ZgnTcrCRJ`
* Metadata:
  * `item: tax-tips-mini-e-book`

Description  
A short, practical guide to common tax mistakes and easy wins. It’s written to be skimmed and applied, not admired. Perfect for a quick boost in tax-time confidence.

Marketing Features

* Avoid common filing mistakes
* Easy to skim in minutes
* Plain-English explanations
* Quick, practical tax tips
* Useful for year-round planning

---

## Tax Tools — Tax Tools Complete Bundle

* Product ID: `prod_U4qbY7fkS42nYo`
* Price ID: `price_1T6guKCMpIgwe61ZQ5PeSvta`
* Metadata:
  * `item: tax-tools-complete-bundle`

Description  
Get all TaxTools resources in one bundle for a single low price. It’s the easiest way to stay organized from planning through filing. Ideal if you want everything without picking and choosing.

Marketing Features

* Best value for full coverage
* Includes every TaxTools resource
* One purchase, instant access
* Saves time during tax season
* Works for individuals and pros

---

# API contract

Base: `https://tools-api.taxmonitor.pro`

## Endpoints

* `GET  /v1/checkout/status?session_id=`
* `POST /v1/checkout/sessions`
* `POST /v1/support/tickets`
* `POST /v1/webhooks/stripe`

## Status endpoint rule

* Status endpoint must be the exact URL form:  
  `https://tools-api.taxmonitor.pro/...`

## UI references

`index.html` currently references:

* `POST https://tools-api.taxmonitor.pro/v1/checkout/sessions`
* `GET  https://tools-api.taxmonitor.pro/v1/checkout/status?session_id=` (planned)
* `POST https://tools-api.taxmonitor.pro/v1/support/tickets` (planned)

---

# Build plan

## Step 1 — Lock API contract

Define exact request/response shapes for all v1 endpoints (no ambiguity).

## Step 2 — Build Worker skeleton

* Routes exist
* Stub JSON responses
* CORS + OPTIONS

## Step 3 — Wire Stripe checkout

Return real `checkoutUrl`.

## Step 4 — Wire webhook → R2 → Gmail receipt

Money + email loop works.

## Step 5 — Build UI around it

UI is already ahead of backend; proceed in vertical slices.

---

# Progress tracker

* [ ] Add missing pages: `about.html`, `faq.html`, `help-center.html`, `tools.html`
* [ ] Add legal pages: `legal/privacy.html`, `legal/refund.html`, `legal/terms.html`
* [ ] Add Worker skeleton: `workers/api/wrangler.toml`, `workers/api/src/index.js`
* [ ] Deploy Worker on `tools-api.taxmonitor.pro/*`
* [ ] Confirm UI checkout calls return stub JSON
* [ ] Replace stub checkout with real Stripe session

---

# Operating rule

When a dependency question comes up (routes, folders, contract rules), check this README first. If the answer isn’t here yet, add it here before proceeding.
