/**
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: withCors(request, env) });
    if (!env.R2_TAXTOOLS) return json(request, env, { error: "server_misconfigured", message: "Missing R2_TAXTOOLS binding" }, 500);

    const path = url.pathname === "/v1/arcade/tokens" ? "/v1/tokens/balance" : url.pathname;

    if (path === "/dev/login") return handleDevLogin(request, env);

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
    if (path === "/v1/webhooks/stripe") return handleStripeWebhook(request, env);

    return notFound(request, env);
  },
};
