/**
 * TaxTools Tools API - v1 stubs
 * Endpoints:
 * - GET  /v1/checkout/status?session_id=
 * - POST /v1/checkout/sessions
 * - POST /v1/support/tickets
 * - POST /v1/webhooks/stripe
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

function withCors(headers, request) {
  const origin = request.headers.get("origin") || "*";
  return {
    ...headers,
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,OPTIONS,POST",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function json(status, body, request) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: withCors(JSON_HEADERS, request),
  });
}

function methodNotAllowed(request) {
  return json(405, { error: "method_not_allowed" }, request);
}

function notFound(request) {
  return json(404, { error: "not_found" }, request);
}

async function readJson(request) {
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function requireQueryParam(url, key) {
  const value = url.searchParams.get(key);
  if (!value) return null;
  return value;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withCors({}, request) });
    }

    // Health (optional but useful)
    if (url.pathname === "/health") {
      return json(200, { ok: true }, request);
    }

    // v1 routes
    if (url.pathname === "/v1/checkout/sessions") {
      if (request.method !== "POST") return methodNotAllowed(request);

      const payload = await readJson(request);
      if (!payload) return json(400, { error: "invalid_json" }, request);

      // Stub response per README contract
      return json(
        200,
        {
          checkoutUrl: "https://example.com/checkout/stub",
          sessionId: "sess_stub_0001",
        },
        request
      );
    }

    if (url.pathname === "/v1/checkout/status") {
      if (request.method !== "GET") return methodNotAllowed(request);

      const sessionId = requireQueryParam(url, "session_id");
      if (!sessionId) return json(400, { error: "missing_session_id" }, request);

      // Stub status per README contract
      return json(
        200,
        {
          sessionId,
          status: "pending",
          updatedAt: new Date().toISOString(),
        },
        request
      );
    }

    if (url.pathname === "/v1/support/tickets") {
      if (request.method !== "POST") return methodNotAllowed(request);

      const payload = await readJson(request);
      if (!payload) return json(400, { error: "invalid_json" }, request);

      // Minimal validation (no fancy stuff yet)
      if (!payload.email || !payload.message) {
        return json(400, { error: "missing_email_or_message" }, request);
      }

      return json(
        200,
        {
          ticketId: "tkt_stub_0001",
        },
        request
      );
    }

    if (url.pathname === "/v1/webhooks/stripe") {
      if (request.method !== "POST") return methodNotAllowed(request);

      // Stub: accept anything for now, real signature validation comes in Step 4.
      return json(200, { ok: true }, request);
    }

    return notFound(request);
  },
};