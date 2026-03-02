/**
 * TaxTools.Tax Monitor Pro — Cloudflare Worker (v1 Tools API)
 *
 * Inbound routes:
 * - GET  /health
 * - GET  /v1/checkout/status?session_id=
 * - POST /v1/checkout/sessions
 * - POST /v1/support/tickets
 * - POST /v1/webhooks/stripe
 *
 * Implemented:
 * - API contract is frozen in README.md (v1).
 * - CORS + OPTIONS for browser-based UI calls.
 * - Stripe webhook requires Stripe-Signature header (verification added Step 4).
 *
 * Planned (next steps):
 * - R2 receipts + canonical objects as authoritative state.
 * - ClickUp projection after R2 write.
 * - Google Workspace transactional email (only permitted system).
 *
 * NOTE:
 * This file is a core contract surface. Keep edits minimal and contract-safe.
 */

/* ------------------------------------------
 * Bindings + Config
 * ------------------------------------------ */

// Step 2: Keep permissive CORS; tighten once UI origin list is final.
const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOWED_HEADERS = "Content-Type, Stripe-Signature";
const CORS_MAX_AGE_SECONDS = "86400";

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function json(data, status = 200, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  };
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

function isHttpsUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ------------------------------------------
 * Validation
 * ------------------------------------------ */

function badRequest(request, message) {
  return json({ error: "bad_request", message }, 400, withCors(request));
}

function methodNotAllowed(request) {
  return json({ error: "bad_request", message: "Method not allowed" }, 405, withCors(request));
}

function notFound(request) {
  return json({ error: "not_found", message: "Not found" }, 404, withCors(request));
}

/* ------------------------------------------
 * Integrations
 * ------------------------------------------ */

// Step 4: Implement real R2 receipt append + canonical upserts.
async function appendReceiptToR2(env, key, payload) {
  void env;
  void key;
  void payload;
}

// Step 4: Implement ClickUp projection after R2 write.
async function projectToClickUp(env, projection) {
  void env;
  void projection;
}

/* ------------------------------------------
 * Handlers
 * ------------------------------------------ */

async function handleCheckoutSessions(request, env) {
  // Contract: POST /v1/checkout/sessions
  if (request.method !== "POST") return methodNotAllowed(request);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON");

  const cancelUrl = typeof body.cancel_url === "string" ? body.cancel_url.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const productId = typeof body.product_id === "string" ? body.product_id.trim() : "";
  const successUrl = typeof body.success_url === "string" ? body.success_url.trim() : "";

  if (!email) return badRequest(request, "Missing email");
  if (!productId) return badRequest(request, "Missing product_id");
  if (!successUrl || !isHttpsUrl(successUrl)) return badRequest(request, "Missing or invalid success_url");
  if (!cancelUrl || !isHttpsUrl(cancelUrl)) return badRequest(request, "Missing or invalid cancel_url");

  // Step 2: Stub values that match the frozen README contract.
  // Step 3: Create real Stripe Checkout Session and return real checkout_url + session_id.
  const sessionId = "cs_stub_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

  // Step 4: Append receipt + project after R2 write.
  await appendReceiptToR2(env, `receipts/checkout_session_created/${sessionId}.json`, {
    cancel_url: cancelUrl,
    created_at: new Date().toISOString(),
    email,
    product_id: productId,
    session_id: sessionId,
    success_url: successUrl,
    type: "checkout_session_created",
  });

  await projectToClickUp(env, {
    email,
    product_id: productId,
    session_id: sessionId,
    type: "checkout_session_created",
  });

  return json(
    {
      checkout_url: checkoutUrl,
      session_id: sessionId,
    },
    201,
    withCors(request)
  );
}

async function handleCheckoutStatus(request) {
  // Contract: GET /v1/checkout/status?session_id=
  if (request.method !== "GET") return methodNotAllowed(request);

  const url = new URL(request.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();
  if (!sessionId) return badRequest(request, "Missing session_id");

  // Step 2: Stub status.
  // Step 3: Look up Stripe session and return real status.
  return json(
    {
      email: "payer@example.com",
      payment_status: "unpaid",
      product_id: "irs-transcript-download",
      session_id: sessionId,
      status: "open",
    },
    200,
    withCors(request)
  );
}

async function handleHealth(request) {
  if (request.method !== "GET") return methodNotAllowed(request);
  return json({ ok: true }, 200, withCors(request));
}

async function handleStripeWebhook(request, env) {
  // Contract: POST /v1/webhooks/stripe
  // Security: In Step 4, verify signature using Stripe webhook secret BEFORE parsing JSON.
  if (request.method !== "POST") return methodNotAllowed(request);

  const signature = request.headers.get("Stripe-Signature") || "";
  if (!signature) {
    return json({ error: "unauthorized", message: "Missing Stripe-Signature" }, 401, withCors(request));
  }

  // Step 2: Accept raw body and stash a receipt stub.
  const raw = await request.text();
  const eventId = "evt_" + crypto.randomUUID().replace(/-/g, "").slice(0, 18);

  await appendReceiptToR2(env, `receipts/stripe/${eventId}.json`, {
    event_id: eventId,
    raw,
    received_at: new Date().toISOString(),
    stripe_signature_present: true,
    type: "stripe_webhook_received",
  });

  // Do not project on unverified webhook.
  return json({ received: true }, 200, withCors(request));
}

async function handleSupportTickets(request, env) {
  // Contract: POST /v1/support/tickets
  if (request.method !== "POST") return methodNotAllowed(request);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest(request, "Invalid JSON");

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  if (!email) return badRequest(request, "Missing email");
  if (!subject) return badRequest(request, "Missing subject");
  if (!message) return badRequest(request, "Missing message");

  const ticketId = "sup_" + crypto.randomUUID().replace(/-/g, "").slice(0, 18);

  await appendReceiptToR2(env, `receipts/support_ticket_created/${ticketId}.json`, {
    created_at: new Date().toISOString(),
    email,
    message,
    session_id: sessionId || null,
    subject,
    ticket_id: ticketId,
    type: "support_ticket_created",
  });

  await projectToClickUp(env, {
    email,
    session_id: sessionId || null,
    subject,
    ticket_id: ticketId,
    type: "support_ticket_created",
  });

  return json(
    {
      status: "received",
      ticket_id: ticketId,
    },
    201,
    withCors(request)
  );
}

/* ------------------------------------------
 * Router
 * ------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withCors(request) });
    }

    // Health
    if (url.pathname === "/health") return handleHealth(request);

    // v1 routes
    if (url.pathname === "/v1/checkout/sessions") return handleCheckoutSessions(request, env);
    if (url.pathname === "/v1/checkout/status") return handleCheckoutStatus(request);
    if (url.pathname === "/v1/support/tickets") return handleSupportTickets(request, env);
    if (url.pathname === "/v1/webhooks/stripe") return handleStripeWebhook(request, env);

    return notFound(request);
  },
};

