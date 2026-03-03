/**
 * TaxTools.Tax Monitor Pro — Cloudflare Worker (v1 API)
 *
 * Contract authority: README.md
 *
 * Routes:
 * - GET  /health
 * - GET  /v1/auth/me
 * - GET  /v1/tokens/balance
 * - GET  /v1/arcade/tokens (alias)
 * - POST /v1/tokens/spend
 * - GET  /v1/games/access?slug=
 * - POST /v1/checkout/sessions
 * - GET  /v1/checkout/status?session_id=
 * - POST /v1/webhooks/stripe
 * - POST /v1/help/tickets
 * - GET  /v1/help/status
 */

/* ------------------------------------------
 * Config
 * ------------------------------------------ */

const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOWED_HEADERS = "Content-Type,Idempotency-Key,Stripe-Signature";
const CORS_MAX_AGE_SECONDS = "86400";
const PLAY_GRANT_WINDOW_MS = 30 * 60 * 1000;

const VALID_GAME_SLUGS = new Set([
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

const SKU_TOKEN_COUNTS = {
  token_pack_small_30: 30,
  token_pack_medium_80: 80,
  token_pack_large_200: 200,
};

const CHECKOUT_ITEM_TO_PRICE_ENV = {
  token_pack_large_200: "STRIPE_PRICE_TOKEN_PACK_LARGE_200",
  token_pack_medium_80: "STRIPE_PRICE_TOKEN_PACK_MEDIUM_80",
  token_pack_small_30: "STRIPE_PRICE_TOKEN_PACK_SMALL_30",
};

/* ------------------------------------------
 * In-memory state (stub until R2 authority)
 * ------------------------------------------ */

const state = {
  accounts: new Map(),
  spendByIdempotency: new Map(),
  checkoutBySessionId: new Map(),
  webhookProcessedSessionIds: new Set(),
  helpTickets: new Map(),
};

/* ------------------------------------------
 * Shared utilities
 * ------------------------------------------ */

function withCors(request, extra = {}) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin || "https://taxmonitor.pro";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Max-Age": CORS_MAX_AGE_SECONDS,
    Vary: "Origin",
    ...extra,
  };
}

function json(request, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...withCors(request),
      ...extraHeaders,
    },
  });
}

function badRequest(request, message) {
  return json(request, { error: "bad_request", message }, 400);
}

function unauthorized(request, message = "Authentication required") {
  return json(request, { error: "unauthorized", message }, 401);
}

function notFound(request) {
  return json(request, { error: "not_found", message: "Not found" }, 404);
}

function methodNotAllowed(request) {
  return json(request, { error: "method_not_allowed", message: "Method not allowed" }, 405);
}

function parseCookies(request) {
  const cookie = request.headers.get("Cookie") || "";
  const out = {};
  for (const part of cookie.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    out[rawKey] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

function getAuthContext(request) {
  const cookies = parseCookies(request);
  const accountId = (cookies.tm_account_id || cookies.account_id || "").trim();
  const email = (cookies.tm_email || cookies.email || "").trim().toLowerCase();
  const session = (cookies.tm_session || cookies.session || "").trim();

  if (!session || !accountId) {
    return { isAuthenticated: false, accountId: null, email: null };
  }

  return {
    isAuthenticated: true,
    accountId,
    email: email || null,
  };
}

function getOrCreateAccount(accountId) {
  if (!state.accounts.has(accountId)) {
    state.accounts.set(accountId, {
      balance: 0,
      grantsBySlug: new Map(),
    });
  }
  return state.accounts.get(accountId);
}

function asIso(ms) {
  return new Date(ms).toISOString();
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacSha256Hex(secret, payload) {
  const keyData = new TextEncoder().encode(secret);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(request, rawBody, env) {
  const header = request.headers.get("Stripe-Signature") || "";
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!header || !secret) return false;

  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [k, v] = piece.trim().split("=");
      return [k, v];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signedPayload);
  return timingSafeEqual(expected, signature);
}

function resolvePriceIdForItem(item, env) {
  const envVar = CHECKOUT_ITEM_TO_PRICE_ENV[item];
  if (!envVar) return null;
  return env[envVar] || null;
}

function tokenCountFromPriceId(priceId, env) {
  for (const [sku, envName] of Object.entries(CHECKOUT_ITEM_TO_PRICE_ENV)) {
    if (env[envName] === priceId) return SKU_TOKEN_COUNTS[sku];
  }
  return 0;
}

async function parseJson(request) {
  return request.json().catch(() => null);
}

/* ------------------------------------------
 * Route handlers
 * ------------------------------------------ */

async function handleHealth(request) {
  if (request.method !== "GET") return methodNotAllowed(request);
  return json(request, { status: "ok" }, 200);
}

async function handleAuthMe(request) {
  if (request.method !== "GET") return methodNotAllowed(request);
  const auth = getAuthContext(request);
  return json(request, {
    isAuthenticated: auth.isAuthenticated,
    accountId: auth.accountId,
    email: auth.email,
  });
}

async function handleTokensBalance(request) {
  if (request.method !== "GET") return methodNotAllowed(request);

  const auth = getAuthContext(request);
  if (!auth.isAuthenticated) return unauthorized(request);

  const account = getOrCreateAccount(auth.accountId);
  return json(request, { balance: account.balance });
}

async function handleTokensSpend(request) {
  if (request.method !== "POST") return methodNotAllowed(request);

  const auth = getAuthContext(request);
  if (!auth.isAuthenticated) return unauthorized(request);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON body");

  const amount = Number(body.amount);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  if (!Number.isInteger(amount) || amount <= 0) return badRequest(request, "amount must be a positive integer");
  if (!reason) return badRequest(request, "reason is required");
  if (!slug || !VALID_GAME_SLUGS.has(slug)) return badRequest(request, "slug is invalid");
  if (!idempotencyKey) return badRequest(request, "idempotencyKey is required");

  const idempotencyScope = `${auth.accountId}:${idempotencyKey}`;
  const existing = state.spendByIdempotency.get(idempotencyScope);
  if (existing) return json(request, existing);

  const account = getOrCreateAccount(auth.accountId);
  if (account.balance < amount) {
    return json(request, { error: "insufficient_balance", balance: account.balance }, 402);
  }

  account.balance -= amount;

  const grantId = crypto.randomUUID();
  const expiresAtMs = Date.now() + PLAY_GRANT_WINDOW_MS;
  const grant = {
    expiresAt: asIso(expiresAtMs),
    grantId,
    slug,
    spent: amount,
  };

  account.grantsBySlug.set(slug, { ...grant, expiresAtMs });

  // ClickUp projection audit comment (canonical write comes before projection when R2 is wired):
  // -{tokensUsed} tokens (Game {slug}, grant {grantId})
  const response = { balance: account.balance, grant };
  state.spendByIdempotency.set(idempotencyScope, response);

  return json(request, response);
}

async function handleGamesAccess(request) {
  if (request.method !== "GET") return methodNotAllowed(request);

  const auth = getAuthContext(request);
  if (!auth.isAuthenticated) return unauthorized(request);

  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  if (!slug || !VALID_GAME_SLUGS.has(slug)) return badRequest(request, "slug is invalid");

  const account = getOrCreateAccount(auth.accountId);
  const grant = account.grantsBySlug.get(slug);

  if (!grant || grant.expiresAtMs <= Date.now()) {
    return json(request, { allowed: false, expiresAt: null, slug });
  }

  return json(request, { allowed: true, expiresAt: grant.expiresAt, slug });
}

async function handleCheckoutSessions(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request);

  const auth = getAuthContext(request);
  if (!auth.isAuthenticated) return unauthorized(request);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON body");

  const item = typeof body.item === "string" ? body.item.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : auth.email;
  const quantity = body.quantity == null ? 1 : Number(body.quantity);

  if (!item) return badRequest(request, "item is required");
  if (item.startsWith("price_")) return badRequest(request, "Frontend must send internal item SKU, not Stripe price_ ID");
  if (!(item in CHECKOUT_ITEM_TO_PRICE_ENV)) return badRequest(request, "Unknown item");
  if (!Number.isInteger(quantity) || quantity < 1) return badRequest(request, "quantity must be a positive integer");
  if (quantity > 1) return badRequest(request, "quantity > 1 is not allowed");

  const priceId = resolvePriceIdForItem(item, env);
  if (!priceId) return json(request, { error: "server_misconfigured", message: "Missing Stripe Price configuration" }, 500);

  const sessionId = `cs_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

  state.checkoutBySessionId.set(sessionId, {
    accountId: auth.accountId,
    email,
    item,
    priceId,
    paymentStatus: "unpaid",
    status: "open",
  });

  return json(request, { checkoutUrl }, 201);
}

async function handleCheckoutStatus(request) {
  if (request.method !== "GET") return methodNotAllowed(request);

  const auth = getAuthContext(request);
  if (!auth.isAuthenticated) return unauthorized(request);

  const url = new URL(request.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();
  if (!sessionId) return badRequest(request, "session_id is required");

  const checkout = state.checkoutBySessionId.get(sessionId);
  const account = getOrCreateAccount(auth.accountId);

  return json(request, {
    sessionId,
    paymentStatus: checkout?.paymentStatus || "unpaid",
    status: checkout?.status || "open",
    balance: account.balance,
  });
}

async function handleStripeWebhook(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request);

  const rawBody = await request.text();
  const validSignature = await verifyStripeSignature(request, rawBody, env);
  if (!validSignature) return unauthorized(request, "Invalid Stripe signature");

  const event = JSON.parse(rawBody || "{}");
  const checkoutSession = event?.data?.object || {};
  const sessionId = checkoutSession.id;

  if (!sessionId) return badRequest(request, "Missing checkout session id");

  if (state.webhookProcessedSessionIds.has(sessionId)) {
    return json(request, { received: true, deduped: true });
  }

  const checkout = state.checkoutBySessionId.get(sessionId);
  if (checkout) {
    const account = getOrCreateAccount(checkout.accountId);
    const priceId = checkoutSession?.metadata?.price_id || checkout.priceId;
    const tokens = tokenCountFromPriceId(priceId, env);

    account.balance += tokens;
    checkout.paymentStatus = "paid";
    checkout.status = "complete";

    // ClickUp projection audit comment (canonical write comes before projection when R2 is wired):
    // +{tokens} tokens (Stripe session {stripeSessionId})
  }

  state.webhookProcessedSessionIds.add(sessionId);
  return json(request, { received: true });
}

async function handleHelpTickets(request) {
  if (request.method !== "POST") return methodNotAllowed(request);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON body");

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!email) return badRequest(request, "email is required");
  if (!subject) return badRequest(request, "subject is required");
  if (!message) return badRequest(request, "message is required");

  const ticketId = `sup_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  state.helpTickets.set(ticketId, {
    email,
    subject,
    message,
    status: "open",
    latestUpdate: createdAt,
  });

  return json(request, { ticket_id: ticketId }, 201);
}

async function handleHelpStatus(request) {
  if (request.method !== "GET") return methodNotAllowed(request);

  const url = new URL(request.url);
  const ticketId = (url.searchParams.get("ticket_id") || url.searchParams.get("supportId") || "").trim();
  if (!ticketId) return badRequest(request, "ticket_id is required");

  const ticket = state.helpTickets.get(ticketId);
  if (!ticket) {
    return json(request, { ticket_id: ticketId, status: "unknown", latestUpdate: null });
  }

  return json(request, {
    ticket_id: ticketId,
    status: ticket.status,
    latestUpdate: ticket.latestUpdate,
  });
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
    if (url.pathname === "/v1/auth/me") return handleAuthMe(request);
    if (url.pathname === "/v1/tokens/balance") return handleTokensBalance(request);
    if (url.pathname === "/v1/arcade/tokens") return handleTokensBalance(request);
    if (url.pathname === "/v1/tokens/spend") return handleTokensSpend(request);
    if (url.pathname === "/v1/games/access") return handleGamesAccess(request);
    if (url.pathname === "/v1/checkout/sessions") return handleCheckoutSessions(request, env);
    if (url.pathname === "/v1/checkout/status") return handleCheckoutStatus(request);
    if (url.pathname === "/v1/webhooks/stripe") return handleStripeWebhook(request, env);
    if (url.pathname === "/v1/help/tickets") return handleHelpTickets(request);
    if (url.pathname === "/v1/help/status") return handleHelpStatus(request);

    return notFound(request);
  },
};
