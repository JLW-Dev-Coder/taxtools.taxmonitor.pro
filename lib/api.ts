const API_BASE = 'https://api.virtuallaunch.pro'

interface ApiOptions extends RequestInit {
  auth?: boolean
}

async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = true, ...fetchOptions } = options

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: auth ? 'include' : 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(
      (error as { error?: string }).error || `API error ${res.status}`
    )
  }

  return res.json()
}

export const api = {
  // Auth
  requestMagicLink: (email: string, redirect?: string) =>
    apiFetch('/v1/tttmp/auth/magic-link/request', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, redirect }),
    }),

  getSession: () =>
    apiFetch<{
      ok: boolean
      user: { account_id: string; email: string; balance: number; membership?: string }
    }>('/v1/tttmp/auth/session'),

  logout: () =>
    apiFetch('/v1/tttmp/auth/logout', { method: 'POST' }),

  // Tokens
  getBalance: () =>
    apiFetch<{ ok: boolean; balance: number; account_id: string }>(
      '/v1/tttmp/tokens/balance'
    ),

  getTokenBalance: (account_id: string) =>
    apiFetch<{ ok: boolean; balance: number; account_id: string }>(
      `/v1/tokens/balance/${account_id}`
    ),

  getTokenPricing: () =>
    apiFetch<{
      ok: boolean
      prices: Array<{
        price_id: string
        amount: number
        currency: string
        tokens: number
        recommended: boolean
        label: string
        type?: string
        badge?: string
      }>
    }>('/v1/tokens/pricing', { auth: false }),

  purchaseTokens: (price_id: string) =>
    apiFetch<{ ok: boolean; session_url: string }>(
      '/v1/tokens/purchase',
      { method: 'POST', body: JSON.stringify({ price_id }) }
    ),

  // Checkout
  createCheckoutSession: (price_id: string) =>
    apiFetch<{ ok: boolean; checkout_url: string; session_id: string }>(
      '/v1/tttmp/checkout/sessions',
      { method: 'POST', body: JSON.stringify({ price_id }) }
    ),

  getCheckoutStatus: (session_id: string) =>
    apiFetch<{
      ok: boolean
      status: string
      credits_added: number
      balance: number
    }>(`/v1/tttmp/checkout/status?session_id=${session_id}`),

  // Games
  grantAccess: (game_slug: string) =>
    apiFetch<{
      ok: boolean
      grant_id: string
      expires_at: string
      balance_after: number
    }>('/v1/tttmp/games/access', {
      method: 'POST',
      body: JSON.stringify({ game_slug }),
    }),

  verifyAccess: (game_slug: string, grant_id: string) =>
    apiFetch<{ ok: boolean; valid: boolean; expires_at: string }>(
      `/v1/tttmp/games/access?game_slug=${game_slug}&grant_id=${grant_id}`
    ),

  endGame: (grant_id: string, score?: number, completed?: boolean) =>
    apiFetch('/v1/tttmp/games/end', {
      method: 'POST',
      body: JSON.stringify({ grant_id, score, completed }),
    }),

  // Support
  createTicket: (data: {
    subject: string
    message: string
    priority?: string
    category?: string
  }) =>
    apiFetch('/v1/tttmp/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTicket: (ticket_id: string) =>
    apiFetch(`/v1/tttmp/support/tickets/${ticket_id}`),

  // Pricing
  getPricing: () =>
    apiFetch<{
      ok: boolean
      prices: Array<{
        price_id: string
        amount: number
        currency: string
        tokens: number
        recommended: boolean
        label: string
      }>
    }>('/v1/pricing/transcripts', { auth: false }),
}
