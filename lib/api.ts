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

// VLP response shapes
export interface SessionResponse {
  ok: boolean
  session: { account_id: string; email: string }
}

export interface BalanceResponse {
  ok: boolean
  balance: { tax_game_tokens: number; transcript_tokens: number }
}

export interface SpendResponse {
  ok: boolean
  grantId: string
  slug: string
}

export interface AccessResponse {
  ok: boolean
  allowed: boolean
  grantId?: string
}

export type TokenPackSku =
  | 'token_pack_small_30'
  | 'token_pack_medium_80'
  | 'token_pack_large_200'

export interface TokenPackage {
  sku: TokenPackSku
  tokens: number
  amount: number // cents
  currency: string
  label: string
  recommended: boolean
  badge?: string
}

// Static token pack catalog — VLP checkout accepts these SKUs.
const TOKEN_PACKAGES: TokenPackage[] = [
  {
    sku: 'token_pack_small_30',
    tokens: 30,
    amount: 999,
    currency: 'usd',
    label: 'Starter',
    recommended: false,
  },
  {
    sku: 'token_pack_medium_80',
    tokens: 80,
    amount: 1999,
    currency: 'usd',
    label: 'Popular',
    recommended: true,
    badge: 'Popular',
  },
  {
    sku: 'token_pack_large_200',
    tokens: 200,
    amount: 3999,
    currency: 'usd',
    label: 'Best Value',
    recommended: false,
    badge: 'Best Value',
  },
]

export const api = {
  // Auth
  requestMagicLink: (email: string, redirect?: string) =>
    apiFetch('/v1/auth/magic-link/request', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, redirect }),
    }),

  verifyMagicLink: (token: string) =>
    apiFetch('/v1/auth/magic-link/verify', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ token }),
    }),

  getSession: () => apiFetch<SessionResponse>('/v1/auth/session'),

  logout: () => apiFetch('/v1/auth/logout', { method: 'POST' }),

  // Tokens
  getTokenBalance: (account_id: string) =>
    apiFetch<BalanceResponse>(`/v1/tokens/balance/${account_id}`),

  spendTokens: (params: {
    amount: number
    slug: string
    reason?: string
    idempotencyKey?: string
  }) =>
    apiFetch<SpendResponse>('/v1/tokens/spend', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        idempotencyKey: params.idempotencyKey || crypto.randomUUID(),
        reason: params.reason || 'arcade_play',
        slug: params.slug,
      }),
    }),

  getTokenPackages: (): Promise<{ ok: true; packages: TokenPackage[] }> =>
    Promise.resolve({ ok: true, packages: TOKEN_PACKAGES }),

  // Checkout
  createCheckoutSession: (item: TokenPackSku) =>
    apiFetch<{ ok: boolean; checkout_url: string; session_id: string }>(
      '/v1/checkout/sessions',
      { method: 'POST', body: JSON.stringify({ item }) }
    ),

  getCheckoutStatus: (session_id: string) =>
    apiFetch<{
      ok: boolean
      status: string
      credits_added?: number
      balance?: number
    }>(`/v1/checkout/status?session_id=${encodeURIComponent(session_id)}`),

  // Games
  checkAccess: (slug: string) =>
    apiFetch<AccessResponse>(
      `/v1/games/access?slug=${encodeURIComponent(slug)}`
    ),

  endGame: (grantId: string, score?: number, completed?: boolean) =>
    apiFetch('/v1/games/end', {
      method: 'POST',
      body: JSON.stringify({ grantId, score, completed }),
    }),

  // Support
  createTicket: (data: {
    subject: string
    message: string
    priority?: string
    category?: string
  }) =>
    apiFetch('/v1/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTicket: (ticket_id: string) =>
    apiFetch(`/v1/support/tickets/${ticket_id}`),

  // Affiliates
  getAffiliate: (account_id: string) =>
    apiFetch<{
      ok: boolean
      referral_code: string
      connect_status: string
      balance_pending: number
      balance_paid: number
      referral_url: string
    }>(`/v1/affiliates/${account_id}`),

  getAffiliateEvents: (account_id: string) =>
    apiFetch<{
      ok: boolean
      events: Array<{
        platform: string
        gross_amount: number
        commission_amount: number
        status: string
        created_at: string
      }>
    }>(`/v1/affiliates/${account_id}/events`),

  startAffiliateOnboarding: () =>
    apiFetch<{ ok: boolean; onboard_url: string }>(
      '/v1/affiliates/connect/onboard',
      { method: 'POST' }
    ),

  requestPayout: (amount: number) =>
    apiFetch<{ ok: boolean; payout_id: string; amount: number; status: string }>(
      '/v1/affiliates/payout/request',
      { method: 'POST', body: JSON.stringify({ amount }) }
    ),
}
