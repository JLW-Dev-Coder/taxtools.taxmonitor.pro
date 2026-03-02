# TaxTools.Tax Monitor Pro

A small “$1 tools” store that generates revenue and routes taxpayers to https://taxmonitor.pro for higher-touch support.

## Pages

Alphabetical list:

- About (`/about.html`)
- Contact (`/support.html`)
- FAQ (`/faq.html`)
- Home (`/index.html`)
- Refund Policy (`/legal/refund.html`)
- Terms of Service (`/legal/terms.html`)
- Tools (`/tools.html`)
- Privacy Policy (`/legal/privacy.html`)
- Help Center (`/help-center.html`)

## Required page components

Every page must include:

- `<meta charset>` and `<meta viewport>`
- DM Sans font import
- Tailwind CDN (`https://cdn.tailwindcss.com/3.4.17`)
- Shared CSS: `/styles/site.css`
- Shared JS: `/scripts/site.js`
- SDK scripts:
  - `/_sdk/element_sdk.js`
  - `/_sdk/data_sdk.js`
- Header navigation links (consistent across pages)
- Footer with:
  - Legal links
  - Support links
  - “Not tax advice” disclaimer
- Favicon and logo references:
  - `/assets/favicon.ico`
  - `/assets/logo.svg`

Page-specific required components:

- About
  - “What this is” section
  - “What this is not” (not tax advice, not representation)
  - CTA to https://taxmonitor.pro

- Contact (support.html)
  - Support form that POSTs to `https://tools-api.taxmonitor.pro/v1/support/tickets`
  - Links to Help Center

- FAQ
  - Pricing + refund + support + “not tax advice” FAQs
  - CTA to Tools

- Home
  - Hero
  - Featured tools preview
  - CTA to Tools + CTA to https://taxmonitor.pro

- Help Center
  - Common issues + “how to use tools”
  - Contact link

- Legal pages
  - Plain content
  - Last updated date
  - Company identity line

- Tools
  - Tool catalog/cards
  - Cart + checkout button
  - Checkout creates session:
    - `POST https://tools-api.taxmonitor.pro/v1/checkout/sessions`
  - Checkout status endpoint exists:
    - `https://tools-api.taxmonitor.pro/v1/checkout/status`

## Repo structure (minimal)

/
- _redirects
- README.md
- MARKET.md
- build.mjs
- index.html
- tools.html
- about.html
- faq.html
- support.html
- help-center.html
- sitemap.xml
- robots.txt
- assets/
- legal/
- partials/
- scripts/
- styles/
- _sdk/

## Build

- `node build.mjs`
- Output goes to `dist/` (must include pages, assets, legal, scripts, styles, and _sdk)

## Routing

- `_redirects` controls routing on Pages.
- Sitemap lists the canonical URLs for all public pages.
- `robots.txt` points to the sitemap.
