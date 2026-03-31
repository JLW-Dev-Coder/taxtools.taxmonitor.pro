'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

interface PriceOption {
  price_id: string
  amount: number
  currency: string
  tokens: number
  recommended: boolean
  label: string
}

export default function PricingPage() {
  const router = useRouter()
  const [prices, setPrices] = useState<PriceOption[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    api.getPricing()
      .then((data) => setPrices(data.prices))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load pricing'))
      .finally(() => setLoading(false))

    api.getSession()
      .then((data) => {
        setLoggedIn(true)
        setBalance(data.user.balance)
      })
      .catch(() => {})
  }, [])

  async function handleBuy(price_id: string) {
    if (!loggedIn) {
      router.push('/login?redirect=/pricing')
      return
    }
    setBuyingId(price_id)
    try {
      const data = await api.createCheckoutSession(price_id)
      window.location.href = data.checkout_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setBuyingId(null)
    }
  }

  function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100)
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Token Packs</h1>
          <p className={styles.subtitle}>
            Tokens power your gameplay. 1 token = 1 game play.
          </p>
          {loggedIn && balance !== null && (
            <p className={styles.balance}>Your balance: {balance} tokens</p>
          )}
        </div>

        {loading ? (
          <p className={styles.loading}>Loading pricing…</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <>
            <div className={styles.grid}>
              {prices.map((price) => (
                <div
                  key={price.price_id}
                  className={`${styles.card} ${price.recommended ? styles.recommended : ''}`}
                >
                  {price.recommended && (
                    <span className={styles.badge}>Most Popular</span>
                  )}
                  <h2 className={styles.tokens}>{price.tokens}</h2>
                  <p className={styles.tokenLabel}>tokens</p>
                  <p className={styles.price}>{formatPrice(price.amount, price.currency)}</p>
                  <p className={styles.plays}>Play {price.tokens} games</p>
                  <button
                    className={styles.buyButton}
                    onClick={() => handleBuy(price.price_id)}
                    disabled={buyingId === price.price_id}
                  >
                    {buyingId === price.price_id ? 'Redirecting…' : price.label || 'Buy'}
                  </button>
                </div>
              ))}
            </div>
            <p className={styles.note}>Tokens never expire.</p>
          </>
        )}
      </main>
    </>
  )
}
