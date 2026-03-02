export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS (minimal)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Health
    if (request.method === "GET" && url.pathname === "/health") {
      return json(
        { ok: true, service: "tools-api", version: "v1-skeleton" },
        200,
        corsHeaders(request)
      );
    }

    // --- v1 contract stubs ---
    if (url.pathname === "/v1/checkout/status" && request.method === "GET") {
      const sessionId = url.searchParams.get("session_id") || "";
      return json(
        {
          ok: true,
          sessionId,
          status: "stub",
        },
        200,
        corsHeaders(request)
      );
    }

    if (url.pathname === "/v1/checkout/sessions" && request.method === "POST") {
      // Stub response, real Stripe comes later
      return json(
        {
          checkoutUrl: null,
          sessionId: "stub_session",
        },
        200,
        corsHeaders(request)
      );
    }

    if (url.pathname === "/v1/support/tickets" && request.method === "POST") {
      return json(
        {
          ok: true,
          ticketId: "stub_ticket",
        },
        200,
        corsHeaders(request)
      );
    }

    if (url.pathname === "/v1/webhooks/stripe" && request.method === "POST") {
      // Stripe signature verification comes later
      return json({ ok: true }, 200, corsHeaders(request));
    }

    // Default 404
    return json(
      { ok: false, error: "Not found", path: url.pathname },
      404,
      corsHeaders(request)
    );
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}