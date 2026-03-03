# README.md — TaxTools.Tax Monitor Pro

A conversion-focused interactive taxpayer games arcade that routes serious users to [https://taxmonitor.pro](https://taxmonitor.pro) for monitoring and representation.

---

# Table of Contents (alphabetical)

* [About-Games Page Standard](#about-games-page-standard)
* [API Contract (v1)](#api-contract-v1)
* [Auth + Cookies](#auth--cookies)
* [Auth + Tokens](#auth--tokens)
* [Checkout Model (Cartless)](#checkout-model-cartless)
* [ClickUp Projection Layer](#clickup-projection-layer)
* [Core System Rules](#core-system-rules)
* [Domains](#domains)
* [Game Catalog (Stripe Marketing)](#game-catalog-stripe-marketing)
* [Game Naming Contract](#game-naming-contract)
* [Games Page Standard](#games-page-standard)
* [Help Flow](#help-flow)
* [Index Page Behavior](#index-page-behavior)
* [Operating Rule](#operating-rule)
* [Page Architecture (Standalone Self-Gating)](#page-architecture-standalone-self-gating)
* [Pricing](#pricing)
* [Repository Structure](#repository-structure)
* [Stripe Flow](#stripe-flow)
* [Stripe IDs](#stripe-ids)
* [Stripe Product + Price Mapping](#stripe-product--price-mapping)
* [Stripe Webhook Destination](#stripe-webhook-destination)
* [Worker](#worker)

---

# About-Games Page Standard

Purpose:

* `/about-games/<slug>.html` pages are **public landing pages** for each game.
* They market the game, show a preview, and perform the **token-spend gate** before redirecting to `/games/<slug>.html`.

Required tooling:

* `https://cdn.tailwindcss.com/3.4.17`
* `/_sdk/element_sdk.js`
* `/_sdk/data_sdk.js`
* Google Font: DM Sans
* Partials:

  * `<!-- PARTIAL:header -->`
  * `<!-- PARTIAL:footer -->`

Required page layout (sections, in order):

* Hero

  * Badge: `Interactive Game • Instant Access`
  * H1: game name
  * Tagline
  * Primary CTA: `Unlock & Play (X tokens)`
  * Secondary CTA: `Try Demo`
* What You’ll Learn

  * 4–8 feature cards
* Demo / Preview

  * Demo must not unlock full gameplay
* How It Works

  * Step 1: Sign in (cookie session)
  * Step 2: Confirm spend (X tokens)
  * Step 3: Play instantly
* FAQ

  * Must include education + token + escalation questions
* Trust + Disclaimers

  * Educational only, not tax advice
  * Not representation
  * Escalation path: [https://taxmonitor.pro](https://taxmonitor.pro)
* Final CTA

  * Primary: `Unlock & Play (X tokens)`
  * Secondary: `View All Games`

Required gating flow (Unlock & Play button):

* Step 1: `GET /v1/auth/me` (credentials included)

  * If `isAuthenticated=false` → open sign-in flow
* Step 2: `GET /v1/tokens/balance`

  * If balance < cost → route user to token purchase flow
* Step 3: `POST /v1/tokens/spend

Purpose:

* “Confirm spend N tokens” gate before unlocking/playing.

Request:

{
"amount": 8,
"idempotencyKey": "string",
"reason": "string",
"slug": "string"
}

Response:

{
"balance": 0,
"grant": {
"expiresAt": "string",
"grantId": "string",
"slug": "string",
"spent": 8
}
}

Rules:

* Must be idempotent using `idempotencyKey`.
* Must validate sufficient balance.
* Spend creates a **play grant** (see Games Page Standard) so leaving/reloading the page does not “lose” the spend within the grant window.

GET /v1/games/access?slug=

Purpose:

* Verify the caller has an active play grant for a specific game.

Response:

{
"allowed": true,
"expiresAt": "string",
"slug": "string"
}

Rules:

* Must use cookie auth (credentials included).
* Must return `allowed=false` when no active grant exists.
* Must not rely on client-side state.

---

# Checkout Model (Cartless)

Architecture choice:

* This system uses **cartless checkout**.
* Users purchase a **single token pack** per checkout session.
* There is no multi-line cart.

Rules:

* `POST /v1/checkout/sessions` accepts a **single internal SKU**.
* Frontend must **never** send Stripe `price_` IDs directly.
* Worker translates internal SKU → Stripe Price ID.
* Quantity defaults to 1 (token packs are pre-sized).

Allowed SKUs (alphabetical):

* token_pack_large_200
* token_pack_medium_80
* token_pack_small_30

Validation:

* Worker must reject unknown `item` values.
* Worker must reject `quantity > 1` unless explicitly allowed.
* Worker must not trust client pricing.

Security principle:

* Only Worker may reference Stripe `price_` IDs.
* Frontend must not expose Stripe price identifiers.

---

# ClickUp Projection Layer

ClickUp is projection only. R2 is the only authority.

This repo uses ClickUp for **human visibility + ops**, not as a source of truth. The Worker must always write:

* receipt → canonical R2 → ClickUp projection

## Lists

Only these lists are used in this repo:

* Accounts — 901710909567
* Support — 901710818377

## Task model

All tasks link to the account via the **Account ID** custom field.

Projection pattern (one task per canonical object):

* `accounts/{accountId}.json` → upsert one task per `accountId` in **Accounts** list
* `support/{supportId}.json` → upsert one task per `supportId` in **Support** list

Linking rule:

* Support tasks must be linked back to the Account task using the ClickUp task link endpoint:

  * `https://api.clickup.com/api/v2/task/{task_id}/link/{links_to}`

## Custom fields

These Custom Field IDs are the authoritative set for this repo.

Accounts list fields (alphabetical):

* Account Event ID — `33ea9fbb-0743-483a-91e4-450ce3bfb0a7`

* Account First Name — `f5c9f6da-c994-4733-a15f-59188b37f531`

* Account Full Name — `b65231cc-4a10-4a38-9d90-1f1c167a4060`

* Account Gaming Credits — `1d4be8be-b920-455a-9c32-68c93ae2954a`

* Account ID — `e5f176ba-82c8-47d8-b3b1-0716d075f43f`

* Account Last Name — `a348d629-fa05-45d8-a2dd-b909f78ddf49`

* Account Order Task Link — `4b22ab15-26f3-4f6f-98b5-7b4f5446e62d`

* Account Orders Status — `94cd8fb3-4ee5-461f-8049-b111c9b8c375`

* Account Primary Email — `a105f99e-b33d-4d12-bb24-f7c827ec761a`

* Account Support Status — `bbdf5418-8be0-452d-8bd0-b9f46643375e`

* Account Support Task Link — `9e14a458-96fd-4109-a276-034d8270e15b`

Support list fields (alphabetical):

* Support Action Required — `aac0816d-0e05-4c57-8196-6098929f35ac`
* Support Email — `7f547901-690d-4f39-8851-d19e19f87bf8`
* Support Event ID — `8e8b453e-01f3-40fe-8156-2e9d9633ebd6`
* Support Latest Update — `03ebc8ba-714e-4f7c-9748-eb1b62e657f7`
* Support Priority — `b96403c7-028a-48eb-b6b1-349f295244b5`
* Support Type — `e09d9f53-4f03-49fe-8c5f-abe3b160b167`

## Projection rules

* Worker never reads ClickUp to decide canonical state.
* Worker always writes: receipt → canonical R2 → ClickUp projection.
* ClickUp updates must be idempotent (same canonical ID always upserts the same task).
* Token balance and token spends are authoritative in Worker state, not ClickUp.

## Comments (audit trail)

Add one ClickUp comment per token mutation:

* Purchase: `+{tokens} tokens (Stripe session {stripeSessionId})`
* Spend: `-{tokensUsed} tokens (Game {slug}, grant {grantId})`

ClickUp is never authoritative.

## Idempotency & safety

* Every mutation event includes `eventId`.
* Stripe dedupe key = Stripe Checkout Session ID.
* Receipt written before canonical change.
* No duplicate tokens.
* Retry-safe processing.
* Avoid duplicate comments by using a deterministic comment fingerprint stored in canonical state.

---

# Core System Rules

* ClickUp is projection only (never authoritative).
* R2 (when implemented) is authoritative before projection.
* Stripe webhook signature verification is required.
* Worker is the only server-side mutation layer.

---

# Domains

* API: [https://tools-api.taxmonitor.pro](https://tools-api.taxmonitor.pro)
* Site: [https://taxtools.taxmonitor.pro](https://taxtools.taxmonitor.pro)

---

# Game Catalog (Stripe Marketing)

Rule:

* **Stripe Product Name must match exactly:** `<filename>.html`

Catalog (alphabetical):

### circular-230-quest.html

**5 features (alphabetical):**

* Badges and achievements
* Certificate of mastery
* Multi-zone progression map
* Scenario-based questions
* Trackable progress

**Description:** A guided challenge through Circular 230 concepts with zones, quizzes, and progression. Finish the journey and earn a mastery-style certificate experience.

### irs-notice-jackpot.html

**5 features (alphabetical):**

* “Spin to win” gameplay loop
* Instant correctness feedback
* Notice clue matching
* Sample letter reveal feel
* Win condition (7/10 jackpot)

**Description:** A slot-machine style notice matcher where players spin and match IRS notice numbers to clues. Hit **7 out of 10** to land the jackpot.

### irs-notice-showdown.html

**5 features (alphabetical):**

* “Beat the house” theme
* Notice knowledge practice
* Score tracking
* Ten-round challenge
* Win threshold (3/10)

**Description:** A casino-style notice challenge where players match notice sections and try to “beat the house.” Win by getting at least **3 out of 10** correct.

### irs-tax-detective.html

**5 features (alphabetical):**

* Clue-based deduction
* Educational explanations
* Pattern recognition gameplay
* Score tracking
* Timed or round-based play

**Description:** A detective-style game focused on solving tax “cases” using clues and IRS-style terminology. Players sharpen interpretation skills by identifying what the signals really mean.

### match-the-tax-notice.html

**5 features (alphabetical):**

* Multiple-choice matching
* Quick rounds (10 questions)
* Simple win condition (3/10)
* Tax notice familiarity builder
* Visible progress and score

**Description:** Players read a tax notice description and choose the correct notice number from options. Get **3 out of 10** correct to win.

### tax-deadline-master.html

**5 features (alphabetical):**

* Deadline-focused learning
* Fast, replayable rounds
* Memory reinforcement
* Practical tax calendar awareness
* Score tracking

**Description:** A deadline mastery game that helps players learn and remember key tax due dates. Built for repetition so the dates actually stick.

### tax-deduction-quest.html

**5 features (alphabetical):**

* Category matching
* Deduction discovery practice
* Large deduction set variety
* Points/score feedback
* Replayable learning loop

**Description:** A deduction matching game that trains players to connect common deductions with the right categories. Designed to build real recall through repeated play.

### tax-document-hunter.html

**5 features (alphabetical):**

* Category selection system
* Document “collection” gameplay
* Level progression vibe
* Points by document rarity
* Trophy-style collection list

**Description:** A document scavenger hunt where players “collect” tax documents, earn points, and build a trophy case. It’s basically organizing paperwork, but disguised as fun.

### tax-jargon-game.html

**5 features (alphabetical):**

* Badges progression
* Flashcards mode
* Lightning rounds
* Quizzes mode
* Terms learned tracking

**Description:** A tax vocabulary trainer with quizzes, flashcards, and lightning rounds. It tracks terms learned and rewards progress so players keep going.

### tax-strategy-adventures.html

**5 features (alphabetical):**

* Collectible strategy library
* Multi-zone quest system
* Progression leveling
* Strategy “cards” with details
* XP-based advancement

**Description:** A strategy quest game where players complete missions and collect tax strategy “cards” across zones. It’s structured like an adventure progression system, but the loot is tax knowledge.

### tax-tips-refund-boost.html

**5 features (alphabetical):**

* 20-question quiz format
* Leaderboard option
* Power-ups (50/50, skip)
* Progress and streak tracking
* Quick-play learning

**Description:** A fast quiz game built around practical tax tips and refund boosters. Players run through **20 questions** with power-ups and score tracking for replay value.

---

# Game Naming Contract

* **Canonical game name = the HTML filename (including `.html`).**
* Marketing titles can be “prettified” in the UI, but:

  * Stripe product name
  * Stripe price nickname
  * Internal catalog references
    must use the **exact filename**.

Canonical filenames (alphabetical):

* circular-230-quest.html
* irs-notice-jackpot.html
* irs-notice-showdown.html
* irs-tax-detective.html
* match-the-tax-notice.html
* tax-deadline-master.html
* tax-deduction-quest.html
* tax-document-hunter.html
* tax-jargon-game.html
* tax-strategy-adventures.html
* tax-tips-refund-boost.html

---

# Games Page Standard

Purpose:

* `/games/<slug>.html` pages host the playable version of each game.
* They must **only** unlock full gameplay after the Worker confirms a valid token spend via an **active play grant**.

Non-negotiables:

* Do not “deduct tokens” client-side.
* Do not unlock gameplay based on querystring, localStorage, or UI state.

Required tooling:

* `https://cdn.tailwindcss.com/3.4.17`
* `/_sdk/element_sdk.js`
* `/_sdk/data_sdk.js`
* Google Font: DM Sans
* Partials:

  * `<!-- PARTIAL:header -->`
  * `<!-- PARTIAL:footer -->`

Required on-load flow (server-authoritative):

1. Auth check

   * `GET /v1/auth/me` (credentials included)
   * If not authenticated → redirect to `/about-games/<slug>.html`

2. Balance check (UI only)

   * `GET /v1/tokens/balance`
   * Display balance in header.

3. Access check (required)

   * `GET /v1/games/access?slug=<slug>`
   * If `allowed=false` → redirect to `/about-games/<slug>.html`
   * If `allowed=true` → unlock gameplay until `expiresAt`.

Play grant model (so exiting does not lose spend):

* `POST /v1/tokens/spend` creates a **play grant** for a specific `slug`.
* A play grant is valid for a **fixed window** (recommended: 60 minutes) starting at spend time.
* During the grant window:

  * Page reloads are allowed.
  * Navigation away and back is allowed.
  * The user does not pay twice.
* After the grant expires:

  * User must confirm a new spend to play again.

Redirect rules:

* All failures redirect to the matching `/about-games/<slug>.html` page.
* `/games/*` pages must not send users to `index.html` for gating (keep it game-specific).

---

# Help Flow

POST /v1/help/tickets

Request:

{
"email": "string",
"message": "string",
"subject": "string"
}

Behavior:

* Validate payload
* Create ClickUp task
* Return ticket_id

GET /v1/help/status

* Returns ticket status
* Returns last update timestamp

---

# Index Page Behavior

Purpose:

* `index.html` is the public entry point.
* It sells the concept (TaxTools Arcade), routes users into game detail pages, and nudges token purchase.

What `index.html` must include:

* Header + footer partials
* A featured games section linking to `/about-games/<slug>.html`
* A clear token model explanation (ex: “Most games cost 5–8 tokens per play”)
* Token packs CTA (30 / 80 / 200)
* Escalation CTA to [https://taxmonitor.pro](https://taxmonitor.pro)

What `index.html` must do (token behavior):

* It must **not** spend tokens.
* It may personalize UI state using:

  * `GET /v1/auth/me` (show signed-in state)
  * `GET /v1/tokens/balance` (display current balance)
* When a user clicks a game CTA:

  * Route to `/about-games/<slug>.html` (not directly to `/games/*`).

Recommended calls (on load):

* `GET /v1/auth/me`

  * If authenticated → call `GET /v1/tokens/balance` and update header/token UI
  * If not authenticated → show “Sign in” and token packs CTA

Recommended calls (after checkout success):

* After Stripe checkout returns success, refresh balance via `GET /v1/tokens/balance`.

---

# Operating Rule

When a dependency question comes up (routes, folders, contract rules), check this README first. If missing, update README before coding.

---

# Page Architecture (Standalone Self-Gating)

Architecture Choice:

* This system uses **standalone marketing pages that self-gate**, not a unified /app shell.
* There is no `/app/*` authenticated container.
* Each page is responsible for verifying auth and tokens directly against the Worker API.

How It Works (per page type):

Root marketing pages (`index.html`, `about.html`, `faq.html`, `help-center.html`, `contact.html`)

* Publicly accessible.
* May call `GET /v1/auth/me` to personalize header state.
* May call `GET /v1/tokens/balance` to show token count.
* Do not require authentication to render.

Game detail pages (`/about-games/*`)

* Publicly accessible.
* Show game description and token cost.
* If user clicks Unlock/Play:

  1. Call `GET /v1/auth/me`.
  2. If not authenticated → trigger login/token flow.
  3. If authenticated → call `GET /v1/tokens/balance`.
  4. If sufficient balance → call `POST /v1/tokens/spend`.
  5. On success → redirect to `/games/<slug>.html`.

Playable game pages (`/games/*`)

* Must verify token spend before full gameplay unlock.
* On load:

  1. Call `GET /v1/auth/me`.
  2. Call `GET /v1/tokens/balance`.
  3. Optionally verify recent spend (if implemented server-side).
* If validation fails → redirect back to detail page.

Token purchase flow

* User purchases tokens via `POST /v1/checkout/sessions`.
* Stripe webhook updates token balance.
* Frontend polls `GET /v1/checkout/status`.
* Frontend refreshes balance via `GET /v1/tokens/balance`.

Security Principle:

* Token spending authority exists only in Worker (`POST /v1/tokens/spend`).
* No token balance logic may exist client-side.

---

# Pricing

### Tokens and Pricing

* Game cost: typically **5–8 tokens per play**

Token packs (alphabetical):

* Large Pack: **200 tokens** for **$39**
* Medium Pack: **80 tokens** for **$19**
* Small Pack: **30 tokens** for **$9**

### Pack guidance

* 30 tokens: ~4–6 plays
* 80 tokens: ~10–16 plays
* 200 tokens: ~25–40 plays

Policy:

* Tokens do not expire.
* Tokens are non-transferable.
* Refund policy is defined in `/legal/refund.html`.

---

# Repository Structure

```text
/
├─ _redirects
├─ README.md
├─ MARKET.md
├─ about.html
├─ build.mjs
├─ contact.html
├─ faq.html
├─ help-center.html
├─ index.html
├─ about-games/
│  ├─ circular-230-quest.html
│  ├─ irs-notice-jackpot.html
│  ├─ irs-notice-showdown.html
│  ├─ irs-tax-detective.html
│  ├─ match-the-tax-notice.html
│  ├─ tax-deadline-master.html
│  ├─ tax-deduction-quest.html
│  ├─ tax-document-hunter.html
│  ├─ tax-jargon-game.html
│  ├─ tax-strategy-adventures.html
│  └─ tax-tips-refund-boost.html
├─ assets/
│  ├─ favicon.ico
│  └─ logo.svg
├─ games/
│  ├─ circular-230-quest.html
│  ├─ irs-notice-jackpot.html
│  ├─ irs-notice-showdown.html
│  ├─ irs-tax-detective.html
│  ├─ match-the-tax-notice.html
│  ├─ tax-deadline-master.html
│  ├─ tax-deduction-quest.html
│  ├─ tax-document-hunter.html
│  ├─ tax-jargon-game.html
│  ├─ tax-strategy-adventures.html
│  └─ tax-tips-refund-boost.html
├─ legal/
│  ├─ privacy.html
│  ├─ refund.html
│  └─ terms.html
├─ partials/
│  ├─ footer.html
│  ├─ header.html
│  ├─ sidebar.html
│  └─ topbar.html
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

Removed:

* /tools/*

---

# Stripe Flow

POST /v1/checkout/sessions

Contract rules:

* `item` must be one of the allowed internal SKUs defined in **Checkout Model (Cartless)**.
* Frontend must not send Stripe `price_` IDs.
* Worker must reject unknown `item` values.

Request:

{
"email": "string",
"item": "token_pack_small_30 | token_pack_medium_80 | token_pack_large_200",
"quantity": 1
}

Response:

{
"checkoutUrl": "string"
}

Frontend behavior (required):

* After receiving `checkoutUrl`, the frontend **must immediately redirect the browser to Stripe Checkout**.
* Example:

  * `window.location = checkoutUrl`
* There is no intermediate internal checkout page.

Stripe Checkout return behavior:

* The Worker must configure Stripe Checkout with:

  * `success_url`
  * `cancel_url`
* Recommended pattern:

  * `success_url` → return to the originating page (`index.html` or the current `/about-games/<slug>.html`) with `?session_id={CHECKOUT_SESSION_ID}` appended.
  * `cancel_url` → return to the same originating page without mutation.

Example:

* If user starts checkout from `index.html`:

  * Return to: `/index.html?session_id=...`
* If user starts checkout from `/about-games/tax-jargon-game.html`:

  * Return to: `/about-games/tax-jargon-game.html?session_id=...`

Post-return frontend flow:

1. Call:

   * `GET /v1/checkout/status?session_id=...`
2. Then call:

   * `GET /v1/tokens/balance`
3. Update UI token balance.

Token crediting behavior (server-side):

POST /v1/webhooks/stripe

* Verify Stripe signature
* Read `metadata.tokens` from the Stripe Price
* Increment token balance by `metadata.tokens` (server-side only)
* Project purchase to ClickUp

GET /v1/checkout/status

* Returns payment status
* Returns updated token balance

GET /v1/arcade/tokens

* Returns current token balance

---

# Stripe IDs

### Stripe Products

Note:

* Checkout uses **Stripe Price IDs** (`price_...`), not Product IDs (`prod_...`).
* Frontend sends internal `item` (SKU); Worker maps SKU → Price ID.

Product IDs (alphabetical):

* STRIPE_PRODUCT_TOKEN_PACK_LARGE_200 = prod_U58Jcfo43FZIz8
* STRIPE_PRODUCT_TOKEN_PACK_MEDIUM_80 = prod_U58vBbhyRNbrRc
* STRIPE_PRODUCT_TOKEN_PACK_SMALL_30 = prod_U58xGeoAbfgaM5

Price IDs (alphabetical):

* STRIPE_PRICE_TOKEN_PACK_LARGE_200 = price_1T6y2OCMpIgwe61Zze4NyfMX
* STRIPE_PRICE_TOKEN_PACK_MEDIUM_80 = price_1T6ye4CMpIgwe61Z4oLNPx5u
* STRIPE_PRICE_TOKEN_PACK_SMALL_30 = price_1T6yfVCMpIgwe61ZvV5XlUut

Internal SKU mapping (alphabetical):

* token_pack_large_200  -> STRIPE_PRICE_TOKEN_PACK_LARGE_200
* token_pack_medium_80  -> STRIPE_PRICE_TOKEN_PACK_MEDIUM_80
* token_pack_small_30   -> STRIPE_PRICE_TOKEN_PACK_SMALL_30

### Worker validation rules

* `POST /v1/checkout/sessions` must reject unknown `item` values.
* Worker must not accept `price_...` directly from the client.
* Worker must create Stripe Checkout Sessions using the mapped Price ID only.

---

# Stripe Product + Price Mapping

Stripe Structure:

* 3 Stripe Products
* 1 Price per Product
* Checkout uses Stripe **Price IDs**, not Product IDs.

Products (alphabetical):

* Large Pack — 200 tokens — $39
* Medium Pack — 80 tokens — $19
* Small Pack — 30 tokens — $9

Worker environment variables (alphabetical):

* STRIPE_PRICE_TOKEN_PACK_LARGE_200
* STRIPE_PRICE_TOKEN_PACK_MEDIUM_80
* STRIPE_PRICE_TOKEN_PACK_SMALL_30

Internal SKU → Stripe Price ID mapping (server-side only):

* token_pack_large_200 → STRIPE_PRICE_TOKEN_PACK_LARGE_200
* token_pack_medium_80 → STRIPE_PRICE_TOKEN_PACK_MEDIUM_80
* token_pack_small_30 → STRIPE_PRICE_TOKEN_PACK_SMALL_30

Stripe metadata requirements:

Each Stripe Price must include metadata:

* tokens = 30 | 80 | 200
* sku = token_pack_*

Webhook behavior:

* Stripe webhook must read `metadata.tokens`.
* Worker must increment token balance by `metadata.tokens`.
* Token balance mutation must occur server-side only.

---

# Stripe Webhook Destination

Yes, this should be defined in the README so it’s auditable and doesn’t drift.

## Destination (Stripe Dashboard)

Alphabetical fields:

* API version: `2025-04-30.basil`
* Description: Receives Stripe events for TaxTools.Tax Monitor Pro checkouts and token crediting.
* Destination ID: `we_1T6crrCMpIgwe61ZAvyySfwv`
* Endpoint URL (authoritative): `https://tools-api.taxmonitor.pro/v1/webhooks/stripe`
* Name: `taxtools-tax-monitor-pro-stripe-webhook`

Listening to events (alphabetical):

* charge.succeeded
* checkout.session.completed
* payment_intent.succeeded

## Non-negotiable rule

* The Stripe webhook destination must **never** point at `POST /v1/checkout/sessions`.
* `/v1/checkout/sessions` creates Checkout Sessions.
* `/v1/webhooks/stripe` ingests Stripe events.

---

# Worker

Location:

workers/api/

Wrangler name:

taxtools-taxmonitor-pro-api

Route:

tools-api.taxmonitor.pro/*
