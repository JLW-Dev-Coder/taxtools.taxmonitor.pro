/**
 * TaxTools.Tax Monitor Pro — Cloudflare Worker (v1 API)
 *
 * Contract authority: README.md
 *
 * Routes (alphabetical by path):
 * - GET  /health
 * - GET  /v1/auth/complete?token=
 * - GET  /v1/auth/me
 * - POST /v1/auth/logout
 * - POST /v1/auth/start
 * - GET  /v1/checkout/status?session_id=
 * - POST /v1/checkout/sessions
 * - GET  /v1/games/access?slug=
 * - GET  /v1/help/status?ticket_id=
 * - POST /v1/help/tickets
 * - GET  /v1/tokens/balance (alias: /v1/arcade/tokens)
 * - POST /v1/tokens/spend
 * - POST /v1/webhooks/stripe
 *
 * Storage:
 * - In-memory (DEV/STAGING): accounts, sessions, grants, loginTokens, helpTickets
 * - Production should migrate to durable storage (R2/D1/KV). Not implemented here.
 */

const COOKIE_NAMES = Object.freeze({
  accountId: "tm_account_id",
  email: "tm_email",
  session: "tm_session",
});

const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  "http://127.0.0.1:8787",
  "http://localhost:8787",
  "https://taxtools.taxmonitor.pro",
]);

const GRANT_TTL_MS = 30 * 60 * 1000;

function json(obj, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(obj, null, 2), { ...init, headers });
}

function text(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "text/plain; charset=utf-8");
  return new Response(body, { ...init, headers });
}

function badRequest(message) {
  return json({ ok: false, error: message }, { status: 400 });
}

function forbidden(message) {
  return json({ ok: false, error: message }, { status: 403 });
}

function notFound() {
  return json({ ok: false, error: "Not found" }, { status: 404 });
}

function unauthorized(message = "Unauthorized") {
  return json({ ok: false, error: message }, { status: 401 });
}

function nowMs() {
  return Date.now();
}

function parseCookies(headerVal) {
  const out = {};
  if (!headerVal) return out;
  const parts = headerVal.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = rest.join("=") || "";
  }
  return out;
}

function setCookie(name, value, opts = {}) {
  const parts = [];
  parts.push(`${name}=${value}`);
  parts.push(`Path=${opts.path || "/"}`);
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure !== false) parts.push("Secure");
  parts.push(`SameSite=${opts.sameSite || "Lax"}`);
  if (typeof opts.maxAge === "number") parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join("; ");
}

function deleteCookie(name) {
  return setCookie(name, "", { maxAge: 0 });
}

function getAllowedOrigins(env) {
  const raw = (env?.ALLOWED_ORIGINS || "").trim();
  if (!raw) return new Set(DEFAULT_ALLOWED_ORIGINS);
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function corsHeaders(req, env) {
  const origin = req.headers.get("origin") || "";
  const allowed = getAllowedOrigins(env);

  const headers = new Headers();
  if (allowed.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
    headers.set("access-control-allow-headers", "content-type, stripe-signature");
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  }
  headers.set("vary", "origin");
  return headers;
}

function withCors(resp, cors) {
  const headers = new Headers(resp.headers);
  for (const [k, v] of cors.entries()) headers.set(k, v);
  return new Response(resp.body, { status: resp.status, headers });
}

async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function requireMethod(req, method) {
  return req.method.toUpperCase() === method.toUpperCase();
}

function safeInt(x) {
  const n = Number.parseInt(String(x), 10);
  return Number.isFinite(n) ? n : null;
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseStripeSignatureHeader(h) {
  // Example: "t=1700000000,v1=abcdef...,v0=..."
  const out = {};
  if (!h) return out;
  for (const part of h.split(",")) {
    const [k, v] = part.trim().split("=");
    if (k && v) out[k] = v;
  }
  return out;
}

function normalizePath(u) {
  return u.pathname.replace(/\/+$/g, "") || "/";
}

function requireSession(state, req) {
  const cookies = parseCookies(req.headers.get("cookie"));
  const sid = cookies[COOKIE_NAMES.session];
  if (!sid) return { ok: false, error: "Missing session cookie" };

  const session = state.sessions.get(sid);
  if (!session) return { ok: false, error: "Invalid session" };

  if (!session.accountId) return { ok: false, error: "Session missing accountId" };
  return { ok: true, session, sid, cookies };
}

function ensureAccount(state, email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return null;

  const existing = state.accountsByEmail.get(key);
  if (existing) return existing;

  const accountId = crypto.randomUUID();
  const acct = {
    accountId,
    createdAt: new Date().toISOString(),
    email: key,
    tokens: 0,
    grantsBySlug: new Map(), // slug -> expiresAtMs
  };

  state.accounts.set(accountId, acct);
  state.accountsByEmail.set(key, acct);
  return acct;
}

async function handleHealth(req, env, state) {
  return json({ ok: true, ts: new Date().toISOString() });
}

async function handleAuthStart(req, env, state) {
  if (!requireMethod(req, "POST")) return badRequest("Expected POST");

  const body = await readJson(req);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) return badRequest("Missing email");

  // DEV/STUB: issue a one-time token that will be redeemed on /v1/auth/complete?token=
  const token = crypto.randomUUID();
  const expiresAtMs = nowMs() + 10 * 60 * 1000;

  state.loginTokens.set(token, { email, expiresAtMs });
  return json({ ok: true, token });
}

async function handleAuthComplete(req, env, state, url) {
  if (!requireMethod(req, "GET")) return badRequest("Expected GET");

  const token = String(url.searchParams.get("token") || "").trim();
  if (!token) return badRequest("Missing token");

  const rec = state.loginTokens.get(token);
  if (!rec) return unauthorized("Invalid token");
  if (rec.expiresAtMs < nowMs()) return unauthorized("Expired token");

  state.loginTokens.delete(token);

  const acct = ensureAccount(state, rec.email);
  if (!acct) return badRequest("Unable to create account");

  const sid = crypto.randomUUID();
  state.sessions.set(sid, {
    accountId: acct.accountId,
    createdAt: new Date().toISOString(),
    email: acct.email,
  });

  const headers = new Headers();
  headers.append("set-cookie", setCookie(COOKIE_NAMES.session, sid));
  headers.append("set-cookie", setCookie(COOKIE_NAMES.accountId, acct.accountId, { httpOnly: false }));
  headers.append("set-cookie", setCookie(COOKIE_NAMES.email, encodeURIComponent(acct.email), { httpOnly: false }));

  // Redirect back to site (safe default)
  headers.set("location", "https://taxtools.taxmonitor.pro/");
  return new Response(null, { status: 302, headers });
}

async function handleAuthMe(req, env, state) {
  if (!requireMethod(req, "GET")) return badRequest("Expected GET");

  const cookies = parseCookies(req.headers.get("cookie"));
  const sid = cookies[COOKIE_NAMES.session];
  if (!sid) return json({ ok: true, authed: false });

  const session = state.sessions.get(sid);
  if (!session) return json({ ok: true, authed: false });

  return json({
    ok: true,
    authed: true,
    accountId: session.accountId || null,
    email: session.email || null,
  });
}

async function handleAuthLogout(req, env, state) {
  if (!requireMethod(req, "POST")) return badRequest("Expected POST");

  const cookies = parseCookies(req.headers.get("cookie"));
  const sid = cookies[COOKIE_NAMES.session];
  if (sid) state.sessions.delete(sid);

  const headers = new Headers();
  headers.append("set-cookie", deleteCookie(COOKIE_NAMES.session));
  headers.append("set-cookie", deleteCookie(COOKIE_NAMES.accountId));
  headers.append("set-cookie", deleteCookie(COOKIE_NAMES.email));

  return json({ ok: true }, { headers });
}

async function handleTokensBalance(req, env, state) {
  if (!requireMethod(req, "GET")) return badRequest("Expected GET");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const acct = state.accounts.get(sess.session.accountId);
  if (!acct) return unauthorized("Account not found");

  return json({ ok: true, tokens: acct.tokens });
}

async function handleTokensSpend(req, env, state) {
  if (!requireMethod(req, "POST")) return badRequest("Expected POST");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const acct = state.accounts.get(sess.session.accountId);
  if (!acct) return unauthorized("Account not found");

  const body = await readJson(req);
  const amount = safeInt(body?.amount);
  const slug = String(body?.slug || "").trim();

  if (!slug) return badRequest("Missing slug");
  if (amount === null || amount < 0) return badRequest("Invalid amount");

  if (acct.tokens < amount) return forbidden("Insufficient tokens");

  acct.tokens -= amount;
  acct.grantsBySlug.set(slug, nowMs() + GRANT_TTL_MS);

  return json({
    ok: true,
    tokens: acct.tokens,
    grant: { expiresAtMs: acct.grantsBySlug.get(slug), slug },
  });
}

async function handleGamesAccess(req, env, state, url) {
  if (!requireMethod(req, "GET")) return badRequest("Expected GET");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const acct = state.accounts.get(sess.session.accountId);
  if (!acct) return unauthorized("Account not found");

  const slug = String(url.searchParams.get("slug") || "").trim();
  if (!slug) return badRequest("Missing slug");

  const expiresAtMs = acct.grantsBySlug.get(slug) || 0;
  const ok = expiresAtMs > nowMs();

  return json({ ok: true, access: ok, expiresAtMs: expiresAtMs || null });
}

async function stripeApiCreateCheckoutSession(env, { accountId, priceId, successUrl, cancelUrl, tokens }) {
  const sk = String(env?.STRIPE_SECRET_KEY || "").trim();
  if (!sk) throw new Error("Missing STRIPE_SECRET_KEY");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[accountId]", accountId);
  form.set("metadata[tokens]", String(tokens));

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${sk}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe error: ${JSON.stringify(data)}`);
  return data;
}

function resolvePackToPrice(env, pack) {
  const key = String(pack || "").trim().toUpperCase();

  const map = Object.freeze({
    TOKEN_PACK_20: "STRIPE_PRICE_TOKEN_PACK_20",
    TOKEN_PACK_50: "STRIPE_PRICE_TOKEN_PACK_50",
  });

  const envKey = map[key];
  if (!envKey) return { ok: false, error: `Unknown pack "${pack}"` };

  const priceId = String(env?.[envKey] || "").trim();
  if (!priceId) return { ok: false, error: `Missing env var ${envKey}` };

  const tokens = safeInt(key.split("_").pop());
  if (tokens === null) return { ok: false, error: `Unable to derive tokens for pack "${pack}"` };

  return { ok: true, priceId, tokens };
}

async function handleCheckoutSessions(req, env, state) {
  if (!requireMethod(req, "POST")) return badRequest("Expected POST");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const acct = state.accounts.get(sess.session.accountId);
  if (!acct) return unauthorized("Account not found");

  const body = await readJson(req);
  const pack = String(body?.pack || "").trim();

  const packRes = resolvePackToPrice(env, pack);
  if (!packRes.ok) return badRequest(packRes.error);

  const successUrl = "https://taxtools.taxmonitor.pro/checkout/success";
  const cancelUrl = "https://taxtools.taxmonitor.pro/checkout/cancel";

  const session = await stripeApiCreateCheckoutSession(env, {
    accountId: acct.accountId,
    priceId: packRes.priceId,
    successUrl,
    cancelUrl,
    tokens: packRes.tokens,
  });

  // Store minimal local lookup for /v1/checkout/status
  state.checkoutSessions.set(session.id, {
    accountId: acct.accountId,
    createdAt: new Date().toISOString(),
    status: "created",
  });

  return json({ ok: true, sessionId: session.id, url: session.url });
}

async function handleCheckoutStatus(req, env, state, url) {
  if (!requireMethod(req, "GET")) return badRequest("Expected GET");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const sessionId = String(url.searchParams.get("session_id") || "").trim();
  if (!sessionId) return badRequest("Missing session_id");

  const rec = state.checkoutSessions.get(sessionId);
  if (!rec) return json({ ok: true, found: false });

  return json({ ok: true, found: true, status: rec.status });
}

async function handleHelpTickets(req, env, state) {
  if (!requireMethod(req, "POST")) return badRequest("Expected POST");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const body = await readJson(req);
  const message = String(body?.message || "").trim();
  if (!message) return badRequest("Missing message");

  const ticketId = crypto.randomUUID();
  state.helpTickets.set(ticketId, {
    accountId: sess.session.accountId,
    createdAt: new Date().toISOString(),
    message,
    status: "open",
  });

  return json({ ok: true, ticket_id: ticketId });
}

async function handleHelpStatus(req, env, state, url) {
  if (!requireMethod(req, "GET")) return badRequest("Expected GET");

  const sess = requireSession(state, req);
  if (!sess.ok) return unauthorized(sess.error);

  const ticketId = String(url.searchParams.get("ticket_id") || "").trim();
  if (!ticketId) return badRequest("Missing ticket_id");

  const rec = state.helpTickets.get(ticketId);
  if (!rec) return json({ ok: true, found: false });

  return json({ ok: true, found: true, status: rec.status });
}

async function handleStripeWebhook(req, env, state) {
  if (!requireMethod(req, "POST")) return badRequest("Expected POST");

  const secret = String(env?.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!secret) return badRequest("Missing STRIPE_WEBHOOK_SECRET");

  const toleranceSec = safeInt(env?.STRIPE_WEBHOOK_TOLERANCE_SECONDS) ?? 300;

  const sigHeader = req.headers.get("stripe-signature") || "";
  const sig = parseStripeSignatureHeader(sigHeader);
  const t = safeInt(sig.t);
  const v1 = String(sig.v1 || "");

  if (!t || !v1) return unauthorized("Missing Stripe signature parts");

  const bodyText = await req.text();
  const age = Math.abs(Math.floor(nowMs() / 1000) - t);
  if (age > toleranceSec) return unauthorized("Stripe signature timestamp outside tolerance");

  const expected = await hmacSha256Hex(secret, `${t}.${bodyText}`);
  if (!timingSafeEqualHex(expected, v1)) return unauthorized("Stripe signature mismatch");

  let event;
  try {
    event = JSON.parse(bodyText);
  } catch {
    return badRequest("Invalid JSON event");
  }

  const eventType = String(event?.type || "");
  if (eventType !== "checkout.session.completed") {
    return json({ ok: true, ignored: true, type: eventType });
  }

  const session = event?.data?.object || {};
  const accountId = String(session?.metadata?.accountId || "").trim();
  const tokens = safeInt(session?.metadata?.tokens);

  if (!accountId) return badRequest("Missing session.metadata.accountId");
  if (tokens === null || tokens <= 0) return badRequest("Missing or invalid session.metadata.tokens");

  const acct = state.accounts.get(accountId);
  if (!acct) return badRequest("Account not found for metadata.accountId");

  acct.tokens += tokens;

  // Best-effort: mark local checkout session status
  const sessionId = String(session?.id || "").trim();
  if (sessionId && state.checkoutSessions.has(sessionId)) {
    const rec = state.checkoutSessions.get(sessionId);
    rec.status = "paid";
  }

  return json({ ok: true });
}

function createState() {
  return {
    accounts: new Map(), // accountId -> acct
    accountsByEmail: new Map(), // email -> acct
    checkoutSessions: new Map(), // sessionId -> { accountId, status, createdAt }
    helpTickets: new Map(), // ticketId -> { ... }
    loginTokens: new Map(), // token -> { email, expiresAtMs }
    sessions: new Map(), // sid -> { accountId, email, createdAt }
  };
}

export default {
  async fetch(req, env, ctx) {
    const state = (globalThis.__STATE__ ||= createState());
    const cors = corsHeaders(req, env);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(req.url);
    const p = normalizePath(url);

    let resp;

    // Health
    if (p === "/health") resp = await handleHealth(req, env, state);

    // Auth
    else if (p === "/v1/auth/start") resp = await handleAuthStart(req, env, state);
    else if (p === "/v1/auth/complete") resp = await handleAuthComplete(req, env, state, url);
    else if (p === "/v1/auth/me") resp = await handleAuthMe(req, env, state);
    else if (p === "/v1/auth/logout") resp = await handleAuthLogout(req, env, state);

    // Checkout
    else if (p === "/v1/checkout/sessions") resp = await handleCheckoutSessions(req, env, state);
    else if (p === "/v1/checkout/status") resp = await handleCheckoutStatus(req, env, state, url);

    // Games
    else if (p === "/v1/games/access") resp = await handleGamesAccess(req, env, state, url);

    // Help
    else if (p === "/v1/help/tickets") resp = await handleHelpTickets(req, env, state);
    else if (p === "/v1/help/status") resp = await handleHelpStatus(req, env, state, url);

    // Tokens
    else if (p === "/v1/arcade/tokens") resp = await handleTokensBalance(req, env, state);
    else if (p === "/v1/tokens/balance") resp = await handleTokensBalance(req, env, state);
    else if (p === "/v1/tokens/spend") resp = await handleTokensSpend(req, env, state);

    // Stripe webhook
    else if (p === "/v1/webhooks/stripe") resp = await handleStripeWebhook(req, env, state);

    else resp = notFound();

    return withCors(resp, cors);
  },
};
