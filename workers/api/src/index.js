/**
 * TaxTools Tax Monitor Pro — Cloudflare Worker (v1 API)
 *
 * Checkout provider: PayPal (replacement for Stripe Checkout)
 *
 * Routes (alphabetical by path):
 * - GET  /dev/login?email=
 * - GET  /dev/mint?amount=
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
 *
 * NOTE:
 * - This keeps the existing v1 contract and swaps Stripe checkout creation for PayPal Orders.
 * - Frontend continues to send internal SKU (e.g. token_pack_large_200), never provider IDs.
 */

/* ------------------------------------------
 * Config
 * ------------------------------------------ */

const COOKIE_NAMES = Object.freeze({
  accountId: "tm_account_id",
  email: "tm_email",
  session: "tm_session",
});

const CORS_ALLOWED_HEADERS = "Content-Type,Idempotency-Key";
const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_MAX_AGE_SECONDS = "86400";

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

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

// SKU mapping (canonical)
const SKU_TOKEN_COUNTS = {
  token_pack_large_200: 200,
  token_pack_medium_80: 80,
  token_pack_small_30: 30,
};

// PayPal amount mapping (USD)
const SKU_USD_AMOUNTS = {
  token_pack_large_200: "39.00",
  token_pack_medium_80: "19.00",
  token_pack_small_30: "9.00",
};

/* ------------------------------------------
 * In-memory state (stub until durable token storage)
 * ------------------------------------------ */

const state = {
  accounts: new Map(), // accountId -> { balance, grantsBySlug }
  checkoutBySessionId: new Map(), // sessionId (PayPal order id) -> checkout record
  helpTickets: new Map(),
  spendByIdempotency: new Map(),
  webhookProcessedSessionIds: new Set(),
};

/* ------------------------------------------
 * Shared utilities
 * ------------------------------------------ */

function withCors(request, env, extra = {}) {
  const origin = request.headers.get("Origin") || "";

  const allowlist = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultAllow = "https://taxtools.taxmonitor.pro";

  const allowOrigin = allowlist.length
    ? (allowlist.includes(origin) ? origin : "")
    : (origin === defaultAllow ? origin : defaultAllow);

  const base = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
    "Access-Control-Max-Age": CORS_MAX_AGE_SECONDS,
    Vary: "Origin",
    ...extra,
  };

  if (allowOrigin) base["Access-Control-Allow-Origin"] = allowOrigin;
  return base;
}

function json(request, env, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...withCors(request, env),
      ...extraHeaders,
    },
  });
}

function badRequest(request, env, message) {
  return json(request, env, { error: "bad_request", message }, 400);
}

function unauthorized(request, env, message = "Authentication required") {
  return json(request, env, { error: "unauthorized", message }, 401);
}

function notFound(request, env) {
  return json(request, env, { error: "not_found", message: "Not found" }, 404);
}

function methodNotAllowed(request, env) {
  return json(request, env, { error: "method_not_allowed", message: "Method not allowed" }, 405);
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

function getCookie(request, name) {
  const cookies = parseCookies(request);
  return (cookies[name] || "").trim();
}

function asIso(ms) {
  return new Date(ms).toISOString();
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix) {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function isValidEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isSafeRedirect(redirect) {
  const r = String(redirect || "").trim();
  if (!r) return false;
  return r.startsWith("/");
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

async function parseJson(request) {
  return request.json().catch(() => null);
}

function isDevEnabled(env) {
  return String(env.DEV_LOGIN_ENABLED || "").trim().toLowerCase() === "true";
}

/* ------------------------------------------
 * R2 keys (auth)
 * ------------------------------------------ */

function keyLoginToken(token) {
  return `auth/login_tokens/${token}.json`;
}

function keySession(sessionId) {
  return `auth/sessions/${sessionId}.json`;
}

/* ------------------------------------------
 * Cookie helpers
 * ------------------------------------------ */

function buildCookie(name, value, { httpOnly = true, maxAgeSec = null } = {}) {
  const parts = [];
  parts.push(`${name}=${encodeURIComponent(value)}`);
  parts.push("Path=/");
  parts.push("Secure");
  parts.push("SameSite=Lax");
  if (httpOnly) parts.push("HttpOnly");
  if (typeof maxAgeSec === "number") parts.push(`Max-Age=${maxAgeSec}`);
  return parts.join("; ");
}

function buildSessionCookies({ accountId, email, sessionId }) {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  return [
    buildCookie(COOKIE_NAMES.session, sessionId, { httpOnly: true, maxAgeSec }),
    buildCookie(COOKIE_NAMES.accountId, accountId, { httpOnly: false, maxAgeSec }),
    buildCookie(COOKIE_NAMES.email, encodeURIComponent(email), { httpOnly: false, maxAgeSec }),
  ];
}

function clearCookies() {
  return [
    buildCookie(COOKIE_NAMES.session, "", { httpOnly: true, maxAgeSec: 0 }),
    buildCookie(COOKIE_NAMES.accountId, "", { httpOnly: false, maxAgeSec: 0 }),
    buildCookie(COOKIE_NAMES.email, "", { httpOnly: false, maxAgeSec: 0 }),
  ];
}

/* ------------------------------------------
 * Google (Gmail API) sender (magic link)
 * ------------------------------------------ */

function b64UrlEncodeBytes(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64UrlEncodeString(s) {
  return b64UrlEncodeBytes(new TextEncoder().encode(s));
}

function pemToPkcs8Bytes(pem) {
  const normalized = String(pem || "").replace(/\\n/g, "\n").trim();
  const m = normalized.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
  if (!m) throw new Error("Invalid GOOGLE_PRIVATE_KEY PEM.");
  const b64 = m[1].replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importGooglePrivateKey(pem) {
  const pkcs8 = pemToPkcs8Bytes(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function googleGetAccessToken(env) {
  const clientEmail = env.GOOGLE_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;
  const tokenUri = env.GOOGLE_TOKEN_URI;
  const sender = env.GOOGLE_WORKSPACE_USER_NO_REPLY;

  if (!clientEmail) throw new Error("Missing GOOGLE_CLIENT_EMAIL.");
  if (!privateKey) throw new Error("Missing GOOGLE_PRIVATE_KEY.");
  if (!tokenUri) throw new Error("Missing GOOGLE_TOKEN_URI.");
  if (!sender) throw new Error("Missing GOOGLE_WORKSPACE_USER_NO_REPLY.");

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 10 * 60;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    aud: tokenUri,
    exp,
    iat,
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/gmail.send",
    sub: sender,
  };

  const signingInput = `${b64UrlEncodeString(JSON.stringify(header))}.${b64UrlEncodeString(JSON.stringify(payload))}`;

  const key = await importGooglePrivateKey(privateKey);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)));

  const jwt = `${signingInput}.${b64UrlEncodeBytes(sig)}`;

  const form = new URLSearchParams();
  form.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  form.set("assertion", jwt);

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data && (data.error_description || data.error) ? String(data.error_description || data.error) : "unknown";
    throw new Error(`Google token error: ${msg}`);
  }

  const token = String(data.access_token || "");
  if (!token) throw new Error("Google token missing access_token.");
  return token;
}

function buildRawEmail({ from, to, subject, text }) {
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    text,
  ].join("\r\n");
  return b64UrlEncodeString(raw);
}

async function gmailSendMagicLink(env, { to, link }) {
  const accessToken = await googleGetAccessToken(env);
  const from = env.GOOGLE_WORKSPACE_USER_NO_REPLY;

  const subject = "Your TaxTools sign-in link";
  const text =
`Sign in to TaxTools

Click this link to finish signing in:
${link}

This link expires in 15 minutes.

If you didn’t request this, ignore this email.
`;

  const raw = buildRawEmail({ from, to, subject, text });

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gmail send failed: ${body || res.status}`);
  }
}

/* ------------------------------------------
 * Auth context
 * ------------------------------------------ */

async function getAuthContext(request, env) {
  const sessionId = getCookie(request, COOKIE_NAMES.session);
  if (!sessionId) return { isAuthenticated: false, accountId: null, email: null };

  const obj = await env.R2_TAXTOOLS.get(keySession(sessionId));
  if (!obj) return { isAuthenticated: false, accountId: null, email: null };

  const sess = await obj.json().catch(() => null);
  if (!sess || !sess.email || !sess.expiresAt || !sess.accountId) return { isAuthenticated: false, accountId: null, email: null };

  const exp = Date.parse(sess.expiresAt);
  if (!Number.isFinite(exp) || exp <= Date.now()) {
    await env.R2_TAXTOOLS.delete(keySession(sessionId));
    return { isAuthenticated: false, accountId: null, email: null };
  }

  return {
    isAuthenticated: true,
    accountId: String(sess.accountId || "").trim() || null,
    email: String(sess.email || "").toLowerCase(),
  };
}

/* ------------------------------------------
 * PayPal helpers
 * ------------------------------------------ */

function paypalApiBase(env) {
  // PAYPAL_ENV should be "live" or "sandbox".
  const mode = String(env.PAYPAL_ENV || "sandbox").trim().toLowerCase();
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function paypalCheckoutBase(env) {
  // Checkout redirect host.
  const mode = String(env.PAYPAL_ENV || "sandbox").trim().toLowerCase();
  return mode === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com";
}

async function paypalGetAccessToken(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const secret = String(env.PAYPAL_CLIENT_SECRET || "").trim();
  if (!clientId) throw new Error("Missing PAYPAL_CLIENT_ID");
  if (!secret) throw new Error("Missing PAYPAL_CLIENT_SECRET");

  const basic = btoa(`${clientId}:${secret}`);
  const res = await fetch(`${paypalApiBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error_description || data?.error || `PayPal token error (${res.status})`;
    throw new Error(String(msg));
  }

  const token = String(data?.access_token || "").trim();
  if (!token) throw new Error("PayPal token missing access_token");
  return token;
}

function buildCheckoutReturnUrls(request) {
  // PayPal returns to return_url with query params token=ORDERID&PayerID=...
  const defaultAllow = "https://taxtools.taxmonitor.pro";

  const origin = String(request.headers.get("Origin") || "").trim();
  const base = origin || defaultAllow;

  const referer = String(request.headers.get("Referer") || "").trim();

  let returnUrl;
  try {
    returnUrl = referer ? new URL(referer) : new URL(`${base}/index.html`);
  } catch {
    returnUrl = new URL(`${base}/index.html`);
  }

  // Avoid open redirects: only return to the same origin.
  const baseUrl = new URL(base);
  if (returnUrl.origin !== baseUrl.origin) returnUrl = new URL(`${base}/index.html`);

  const cancelUrl = new URL(returnUrl.toString());
  cancelUrl.searchParams.set("paypal", "cancel");

  const successUrl = new URL(returnUrl.toString());
  successUrl.searchParams.set("paypal", "success");

  return {
    cancel_url: cancelUrl.toString(),
    success_url: successUrl.toString(),
  };
}

async function paypalCreateOrder({ accessToken, amountUsd, cancel_url, success_url, env, metadata }) {
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: String(amountUsd),
        },
        custom_id: metadata?.accountId || undefined,
        invoice_id: metadata?.idempotencyKey || undefined,
        description: metadata?.description || undefined,
      },
    ],
    application_context: {
      user_action: "PAY_NOW",
      return_url: success_url,
      cancel_url: cancel_url,
    },
  };

  const res = await fetch(`${paypalApiBase(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || `PayPal order create error (${res.status})`;
    throw new Error(String(msg));
  }

  const orderId = String(data?.id || "").trim();
  if (!orderId) throw new Error("PayPal order missing id");

  // PayPal includes approval links; we also provide a fallback checkoutnow redirect.
  const links = Array.isArray(data?.links) ? data.links : [];
  const approve = links.find((l) => l && l.rel === "approve")?.href;
  const checkoutUrl = approve || `${paypalCheckoutBase(env)}/checkoutnow?token=${encodeURIComponent(orderId)}`;

  return { checkoutUrl, orderId };
}

async function paypalCaptureOrder({ accessToken, env, orderId }) {
  const res = await fetch(`${paypalApiBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || `PayPal capture error (${res.status})`;
    throw new Error(String(msg));
  }

  const status = String(data?.status || "").trim();
  return { data, status };
}

/* ------------------------------------------
 * Route handlers
 * ------------------------------------------ */

async function handleAuthComplete(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);

  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  if (!token) return new Response("Missing token.", { status: 400 });

  const obj = await env.R2_TAXTOOLS.get(keyLoginToken(token));
  if (!obj) return new Response("Invalid or expired token.", { status: 400 });

  const rec = await obj.json().catch(() => null);
  if (!rec || !rec.email || !rec.expiresAt || !rec.redirect) return new Response("Invalid token record.", { status: 400 });

  const exp = Date.parse(rec.expiresAt);
  if (!Number.isFinite(exp) || exp <= Date.now()) {
    await env.R2_TAXTOOLS.delete(keyLoginToken(token));
    return new Response("Invalid or expired token.", { status: 400 });
  }

  await env.R2_TAXTOOLS.delete(keyLoginToken(token));

  const sessionId = randomId("sess");
  const email = String(rec.email).toLowerCase();
  const accountId = randomId("acct");

  const session = {
    accountId,
    createdAt: nowIso(),
    email,
    expiresAt: asIso(Date.now() + SESSION_TTL_MS),
  };

  await env.R2_TAXTOOLS.put(keySession(sessionId), JSON.stringify(session), {
    httpMetadata: { contentType: "application/json" },
  });

  const headers = new Headers();
  for (const c of buildSessionCookies({ accountId, email, sessionId })) headers.append("Set-Cookie", c);
  headers.set("Location", String(rec.redirect));

  return new Response(null, { status: 302, headers });
}

async function handleAuthMe(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);
  const auth = await getAuthContext(request, env);
  return json(request, env, { accountId: auth.accountId, email: auth.email, isAuthenticated: auth.isAuthenticated });
}

async function handleAuthLogout(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request, env);

  const sessionId = getCookie(request, COOKIE_NAMES.session);
  if (sessionId) await env.R2_TAXTOOLS.delete(keySession(sessionId));

  const headers = new Headers();
  for (const c of clearCookies()) headers.append("Set-Cookie", c);

  return json(request, env, { ok: true }, 200, Object.fromEntries(headers));
}

async function handleAuthStart(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request, env);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, env, "Invalid JSON body");

  const email = String(body.email || "").trim().toLowerCase();
  const redirect = String(body.redirect || "").trim();

  if (!isValidEmail(email)) return badRequest(request, env, "Invalid email");
  if (!isSafeRedirect(redirect)) return badRequest(request, env, "Invalid redirect (must be a relative path)");

  const token = randomId("ml");
  const rec = {
    createdAt: nowIso(),
    email,
    expiresAt: asIso(Date.now() + LOGIN_TOKEN_TTL_MS),
    redirect,
  };

  await env.R2_TAXTOOLS.put(keyLoginToken(token), JSON.stringify(rec), {
    httpMetadata: { contentType: "application/json" },
  });

  const baseUrl = String(env.TAXTOOLS_AUTH_BASE_URL || "https://tools-api.taxmonitor.pro").replace(/\/+$/g, "");
  const link = `${baseUrl}/v1/auth/complete?token=${encodeURIComponent(token)}`;

  await gmailSendMagicLink(env, { link, to: email });

  return json(request, env, { ok: true }, 200);
}

async function handleDevLogin(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);
  if (!isDevEnabled(env)) return notFound(request, env);

  const url = new URL(request.url);
  const email = String(url.searchParams.get("email") || "dev@local.test").trim().toLowerCase();

  const sessionId = randomId("sess");
  const accountId = randomId("acct");

  const session = {
    accountId,
    createdAt: nowIso(),
    email,
    expiresAt: asIso(Date.now() + SESSION_TTL_MS),
  };

  await env.R2_TAXTOOLS.put(keySession(sessionId), JSON.stringify(session), {
    httpMetadata: { contentType: "application/json" },
  });

  const headers = new Headers();
  for (const c of buildSessionCookies({ accountId, email, sessionId })) headers.append("Set-Cookie", c);
  headers.set("Location", "https://taxtools.taxmonitor.pro/");

  return new Response(null, { status: 302, headers });
}

async function handleDevMint(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);
  if (!isDevEnabled(env)) return notFound(request, env);

  const auth = await getAuthContext(request, env);
  if (!auth.isAuthenticated || !auth.accountId) return unauthorized(request, env);

  const url = new URL(request.url);
  const amountRaw = url.searchParams.get("amount");
  const amount = amountRaw == null || amountRaw === "" ? 200 : Number(amountRaw);

  if (!Number.isInteger(amount) || amount <= 0) return badRequest(request, env, "amount must be a positive integer");
  if (amount > 10000) return badRequest(request, env, "amount too large (max 10000)");

  const account = getOrCreateAccount(auth.accountId);
  account.balance += amount;

  return json(request, env, { ok: true, balance: account.balance, minted: amount }, 200);
}

async function handleCheckoutSessions(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request, env);

  const auth = await getAuthContext(request, env);
  if (!auth.isAuthenticated) return unauthorized(request, env);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, env, "Invalid JSON body");

  const item = typeof body.item === "string" ? body.item.trim() : "";
  const quantity = body.quantity == null ? 1 : Number(body.quantity);

  if (!item) return badRequest(request, env, "item is required");
  if (item.startsWith("price_")) return badRequest(request, env, "Frontend must send internal item SKU, not provider ID");
  if (!(item in SKU_TOKEN_COUNTS)) return badRequest(request, env, "Unknown item");
  if (!Number.isInteger(quantity) || quantity < 1) return badRequest(request, env, "quantity must be a positive integer");
  if (quantity > 1) return badRequest(request, env, "quantity > 1 is not allowed");

  const amountUsd = SKU_USD_AMOUNTS[item];
  if (!amountUsd) return json(request, env, { error: "server_misconfigured", message: "Missing PayPal amount configuration" }, 500);

  let accessToken;
  try {
    accessToken = await paypalGetAccessToken(env);
  } catch (err) {
    return json(request, env, { error: "server_misconfigured", message: String(err?.message || err) }, 500);
  }

  const { cancel_url, success_url } = buildCheckoutReturnUrls(request);
  const idempotencyKey = String(request.headers.get("Idempotency-Key") || "").trim() || `checkout:${auth.accountId}:${item}`;

  let created;
  try {
    created = await paypalCreateOrder({
      accessToken,
      amountUsd,
      cancel_url,
      env,
      metadata: {
        accountId: auth.accountId,
        description: `TaxTools token pack: ${item}`,
        idempotencyKey,
      },
      success_url,
    });
  } catch (err) {
    return json(request, env, { error: "paypal_error", message: String(err?.message || err) }, 502);
  }

  const { checkoutUrl, orderId } = created;

  // We keep the v1 response shape: sessionId + checkoutUrl.
  // sessionId is the PayPal order id.
  const sessionId = orderId;

  state.checkoutBySessionId.set(sessionId, {
    accountId: auth.accountId,
    amountUsd,
    item,
    provider: "paypal",
    paymentStatus: "unpaid",
    status: "open",
  });

  return json(request, env, { checkoutUrl, sessionId }, 201);
}

async function handleCheckoutStatus(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);

  const auth = await getAuthContext(request, env);
  if (!auth.isAuthenticated) return unauthorized(request, env);

  const url = new URL(request.url);

  // Keep contract param name "session_id".
  // Also accept PayPal redirect param "token" as an alias.
  const sessionId = (url.searchParams.get("session_id") || url.searchParams.get("token") || "").trim();
  if (!sessionId) return badRequest(request, env, "session_id is required");

  const checkout = state.checkoutBySessionId.get(sessionId);
  const account = auth.accountId ? getOrCreateAccount(auth.accountId) : null;

  // If PayPal redirected back, attempt capture on status check.
  // This keeps the existing client behavior (GET status then refresh balance).
  if (checkout && checkout.provider === "paypal" && checkout.status !== "complete") {
    let accessToken;
    try {
      accessToken = await paypalGetAccessToken(env);
      const captured = await paypalCaptureOrder({ accessToken, env, orderId: sessionId });

      if (String(captured.status).toUpperCase() === "COMPLETED") {
        const tokens = SKU_TOKEN_COUNTS[checkout.item] || 0;
        if (account && tokens > 0 && !state.webhookProcessedSessionIds.has(sessionId)) {
          account.balance += tokens;
          state.webhookProcessedSessionIds.add(sessionId);
        }

        checkout.paymentStatus = "paid";
        checkout.status = "complete";
      }
    } catch {
      // Leave status as-is; caller can retry.
    }
  }

  return json(request, env, {
    balance: account ? account.balance : 0,
    paymentStatus: checkout?.paymentStatus || "unpaid",
    sessionId,
    status: checkout?.status || "open",
  });
}

async function handleGamesAccess(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);

  const auth = await getAuthContext(request, env);
  if (!auth.isAuthenticated) return unauthorized(request, env);

  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  if (!slug || !VALID_GAME_SLUGS.has(slug)) return badRequest(request, env, "slug is invalid");
  if (!auth.accountId) return unauthorized(request, env);

  const account = getOrCreateAccount(auth.accountId);
  const grant = account.grantsBySlug.get(slug);

  if (!grant || grant.expiresAtMs <= Date.now()) {
    return json(request, env, { allowed: false, expiresAt: null, slug });
  }

  return json(request, env, { allowed: true, expiresAt: grant.expiresAt, slug });
}

async function handleHealth(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);
  return json(request, env, { status: "ok" }, 200);
}

async function handleHelpStatus(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);

  const url = new URL(request.url);
  const ticketId = (url.searchParams.get("ticket_id") || url.searchParams.get("supportId") || "").trim();
  if (!ticketId) return badRequest(request, env, "ticket_id is required");

  const ticket = state.helpTickets.get(ticketId);
  if (!ticket) return json(request, env, { latestUpdate: null, status: "unknown", ticket_id: ticketId });

  return json(request, env, { latestUpdate: ticket.latestUpdate, status: ticket.status, ticket_id: ticketId });
}

async function handleHelpTickets(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request, env);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, env, "Invalid JSON body");

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!email) return badRequest(request, env, "email is required");
  if (!subject) return badRequest(request, env, "subject is required");
  if (!message) return badRequest(request, env, "message is required");

  const ticketId = `sup_${crypto.randomUUID()}`;
  const createdAt = nowIso();

  state.helpTickets.set(ticketId, { email, latestUpdate: createdAt, message, status: "open", subject });

  return json(request, env, { ticket_id: ticketId }, 201);
}

async function handleTokensBalance(request, env) {
  if (request.method !== "GET") return methodNotAllowed(request, env);

  const auth = await getAuthContext(request, env);
  if (!auth.isAuthenticated) return unauthorized(request, env);
  if (!auth.accountId) return unauthorized(request, env);

  const account = getOrCreateAccount(auth.accountId);
  return json(request, env, { balance: account.balance });
}

async function handleTokensSpend(request, env) {
  if (request.method !== "POST") return methodNotAllowed(request, env);

  const auth = await getAuthContext(request, env);
  if (!auth.isAuthenticated) return unauthorized(request, env);
  if (!auth.accountId) return unauthorized(request, env);

  const body = await parseJson(request);
  if (!body || typeof body !== "object") return badRequest(request, env, "Invalid JSON body");

  const amount = Number(body.amount);
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!Number.isInteger(amount) || amount <= 0) return badRequest(request, env, "amount must be a positive integer");
  if (!idempotencyKey) return badRequest(request, env, "idempotencyKey is required");
  if (!reason) return badRequest(request, env, "reason is required");
  if (!slug || !VALID_GAME_SLUGS.has(slug)) return badRequest(request, env, "slug is invalid");

  const idempotencyScope = `${auth.accountId}:${idempotencyKey}`;
  const existing = state.spendByIdempotency.get(idempotencyScope);
  if (existing) return json(request, env, existing);

  const account = getOrCreateAccount(auth.accountId);
  if (account.balance < amount) return json(request, env, { balance: account.balance, error: "insufficient_balance" }, 402);

  account.balance -= amount;

  const grantId = crypto.randomUUID();
  const expiresAtMs = Date.now() + PLAY_GRANT_WINDOW_MS;

  const grant = {
    expiresAt: asIso(expiresAtMs),
    expiresAtMs,
    grantId,
    slug,
    spent: amount,
  };

  account.grantsBySlug.set(slug, grant);

  const response = {
    balance: account.balance,
    grant: { expiresAt: grant.expiresAt, grantId: grant.grantId, slug: grant.slug, spent: grant.spent },
  };

  state.spendByIdempotency.set(idempotencyScope, response);
  return json(request, env, response);
}

/* ------------------------------------------
 * Router
 * ------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: withCors(request, env) });
    if (!env.R2_TAXTOOLS) return json(request, env, { error: "server_misconfigured", message: "Missing R2_TAXTOOLS binding" }, 500);

    const path = url.pathname === "/v1/arcade/tokens" ? "/v1/tokens/balance" : url.pathname;

    if (path === "/dev/login") return handleDevLogin(request, env);
    if (path === "/dev/mint") return handleDevMint(request, env);

    if (path === "/health") return handleHealth(request, env);
    if (path === "/v1/auth/complete") return handleAuthComplete(request, env);
    if (path === "/v1/auth/me") return handleAuthMe(request, env);
    if (path === "/v1/auth/logout") return handleAuthLogout(request, env);
    if (path === "/v1/auth/start") return handleAuthStart(request, env);
    if (path === "/v1/checkout/sessions") return handleCheckoutSessions(request, env);
    if (path === "/v1/checkout/status") return handleCheckoutStatus(request, env);
    if (path === "/v1/games/access") return handleGamesAccess(request, env);
    if (path === "/v1/help/status") return handleHelpStatus(request, env);
    if (path === "/v1/help/tickets") return handleHelpTickets(request, env);
    if (path === "/v1/tokens/balance") return handleTokensBalance(request, env);
    if (path === "/v1/tokens/spend") return handleTokensSpend(request, env);

    return notFound(request, env);
  },
};
