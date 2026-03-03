/**
 * TaxTools.Tax Monitor Pro — Cloudflare Worker (v1 Tools API + Arcade)
 *
 * Inbound routes:
 * - GET  /health
 * - GET  /v1/checkout/status?session_id=
 * - GET  /v1/tokens/balance?email=...&token=...
 * - POST /v1/auth/verify
 * - POST /v1/checkout/sessions
 * - POST /v1/support/tickets
 * - POST /v1/tokens/unlock
 * - POST /v1/webhooks/stripe
 *
 * Implemented:
 * - API contract is frozen in README.md (v1).
 * - Arcade endpoints are contract-locked (verify, balance, unlock).
 * - CORS + OPTIONS for browser-based UI calls.
 * - Stripe webhook requires Stripe-Signature header (verification added Step 4).
 *
 * Planned (next steps):
 * - R2 authoritative storage for balances + entitlements.
 * - Paid-only delivery loops where applicable via Google Workspace email.
 * - ClickUp projection after R2 write.
 *
 * NOTE:
 * This file is a core contract surface. Keep edits minimal and contract-safe.
 */

/* ------------------------------------------
 * Bindings + Config
 * ------------------------------------------ */

const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOWED_HEADERS = "Content-Type, Stripe-Signature";
const CORS_MAX_AGE_SECONDS = "86400";

const GAME_SLUGS = new Set([
  "circular-230-quest",
  "irs-notice-jackpot",
  "irs-notice-showdown",
  "irs-tax-detective",
  "match-the-tax-notice",
  "tax-deadline-master",
  "tax-deduction-quest",
  "tax-document-hunter",
  "tax-jargon-game",
  "tax-strategy-adventures",
  "tax-tips-refund-boost",
]);

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function json(data, status = 200, extraHeaders = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8", ...extraHeaders };
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function withCors(request, extra = {}) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Max-Age": CORS_MAX_AGE_SECONDS,
    ...extra,
  };
}

/* ------------------------------------------
 * Validation
 * ------------------------------------------ */

function badRequest(request, message) {
  return json({ error: "bad_request", message }, 400, withCors(request));
}

function unauthorized(request, message) {
  return json({ ok: false, error: "unauthorized", message }, 401, withCors(request));
}

function paymentRequired(request, message, balance) {
  return json({ error: "insufficient_balance", message, balance }, 402, withCors(request));
}

function methodNotAllowed(request) {
  return json({ error: "bad_request", message: "Method not allowed" }, 405, withCors(request));
}

function notFound(request) {
  return json({ error: "not_found", message: "Not found" }, 404, withCors(request));
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeToken(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/* ------------------------------------------
 * Integrations
 * ------------------------------------------ */

// Step 4+: persist/read in R2.
// For now, a stub in-memory model per request.
async function loadPlayerState(env, email, token) {
  void env;

  // Contract-safe stub: accept any non-empty email + token.
  if (!email || !token) return null;

  return { balance: 0, entitlements: [] };
}

async function savePlayerState(env, email, token, state) {
  void env;
  void email;
  void token;
  void state;
}

/* ------------------------------------------
 * Handlers
 * ------------------------------------------ */

async function handleAuthVerify(request, env) {
  // Contract: POST /v1/auth/verify
  if (request.method !== "POST") return methodNotAllowed(request);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON");

  const email = normalizeEmail(body.email);
  const token = normalizeToken(body.token);

  if (!email) return badRequest(request, "Missing email");
  if (!token) return badRequest(request, "Missing token");

  const state = await loadPlayerState(env, email, token);
  if (!state) return unauthorized(request, "Invalid email or token");

  return json(
    {
      ok: true,
      balance: state.balance,
      entitlements: state.entitlements,
    },
    200,
    withCors(request)
  );
}

async function handleTokensBalance(request, env) {
  // Contract: GET /v1/tokens/balance?email=...&token=...
  if (request.method !== "GET") return methodNotAllowed(request);

  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get("email") || "");
  const token = normalizeToken(url.searchParams.get("token") || "");

  if (!email) return badRequest(request, "Missing email");
  if (!token) return badRequest(request, "Missing token");

  const state = await loadPlayerState(env, email, token);
  if (!state) return unauthorized(request, "Invalid email or token");

  return json({ balance: state.balance }, 200, withCors(request));
}

async function handleTokensUnlock(request, env) {
  // Contract: POST /v1/tokens/unlock
  if (request.method !== "POST") return methodNotAllowed(request);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON");

  const email = normalizeEmail(body.email);
  const token = normalizeToken(body.token);
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!email) return badRequest(request, "Missing email");
  if (!token) return badRequest(request, "Missing token");
  if (!slug) return badRequest(request, "Missing slug");
  if (!GAME_SLUGS.has(slug)) return badRequest(request, "Invalid slug");

  const state = await loadPlayerState(env, email, token);
  if (!state) return unauthorized(request, "Invalid email or token");

  // Stub pricing model (Step 4: use real per-game pricing config)
  const price = 10;

  if (state.entitlements.includes(slug)) {
    return json({ balance: state.balance, entitlements: state.entitlements }, 200, withCors(request));
  }

  if (state.balance < price) {
    return paymentRequired(request, "Not enough tokens", state.balance);
  }

  const next = {
    balance: state.balance - price,
    entitlements: [...state.entitlements, slug].sort(),
  };

  await savePlayerState(env, email, token, next);

  return json({ balance: next.balance, entitlements: next.entitlements }, 200, withCors(request));
}

async function handleCheckoutSessions(request, env) {
  // Existing endpoint retained (token packs wiring later)
  if (request.method !== "POST") return methodNotAllowed(request);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON");

  const email = normalizeEmail(body.email);
  const productId = isNonEmptyString(body.product_id) ? body.product_id.trim() : "";
  const successUrl = isNonEmptyString(body.success_url) ? body.success_url.trim() : "";
  const cancelUrl = isNonEmptyString(body.cancel_url) ? body.cancel_url.trim() : "";

  if (!email) return badRequest(request, "Missing email");
  if (!productId) return badRequest(request, "Missing product_id");
  if (!successUrl) return badRequest(request, "Missing success_url");
  if (!cancelUrl) return badRequest(request, "Missing cancel_url");

  const sessionId = "cs_stub_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

  return json({ checkout_url: checkoutUrl, session_id: sessionId }, 201, withCors(request));
}

async function handleCheckoutStatus(request) {
  if (request.method !== "GET") return methodNotAllowed(request);

  const url = new URL(request.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();
  if (!sessionId) return badRequest(request, "Missing session_id");

  return json(
    {
      email: "payer@example.com",
      payment_status: "unpaid",
      product_id: "tax-tools-arcade-token-pack-20",
      session_id: sessionId,
      status: "open",
    },
    200,
    withCors(request)
  );
}

async function handleHealth(request) {
  if (request.method !== "GET") return methodNotAllowed(request);
  return json({ ok: true, service: "tools-api", version: "v1-arcade-skeleton" }, 200, withCors(request));
}

async function handleStripeWebhook(request) {
  if (request.method !== "POST") return methodNotAllowed(request);
  const signature = request.headers.get("Stripe-Signature") || "";
  if (!signature) return unauthorized(request, "Missing Stripe-Signature");
  return json({ received: true }, 200, withCors(request));
}

async function handleSupportTickets(request) {
  if (request.method !== "POST") return methodNotAllowed(request);
  return json({ ticket_id: "sup_stub", status: "received" }, 201, withCors(request));
}

/* ------------------------------------------
 * Router
 * ------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withCors(request) });
    }

    if (url.pathname === "/health") return handleHealth(request);

    // Arcade
    if (url.pathname === "/v1/auth/verify") return handleAuthVerify(request, env);
    if (url.pathname === "/v1/tokens/balance") return handleTokensBalance(request, env);
    if (url.pathname === "/v1/tokens/unlock") return handleTokensUnlock(request, env);

    // Existing
    if (url.pathname === "/v1/checkout/sessions") return handleCheckoutSessions(request, env);
    if (url.pathname === "/v1/checkout/status") return handleCheckoutStatus(request);
    if (url.pathname === "/v1/support/tickets") return handleSupportTickets(request, env);
    if (url.pathname === "/v1/webhooks/stripe") return handleStripeWebhook(request);

    return notFound(request);
  },
};
