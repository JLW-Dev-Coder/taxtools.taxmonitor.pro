'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

function AccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    api.getSession()
      .then(async (data) => {
        setEmail(data.session.email)
        try {
          const bal = await api.getTokenBalance(data.session.account_id)
          setBalance(bal.balance.tax_game_tokens)
        } catch {
          setBalance(0)
        }
        setLoading(false)
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [router])

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return
    api.getCheckoutStatus(sessionId)
      .then(async (data) => {
        if (data.status === 'complete' || data.status === 'paid') {
          const added = data.credits_added ?? 0
          setPaymentMessage(
            `Payment successful!${added ? ` ${added} tokens added to your account.` : ''}`
          )
          try {
            const session = await api.getSession()
            const bal = await api.getTokenBalance(session.session.account_id)
            setBalance(bal.balance.tax_game_tokens)
          } catch {}
        }
      })
      .catch(() => {})
  }, [searchParams])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await api.logout()
      router.replace('/')
    } catch {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.loading}>Loading…</p>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        {paymentMessage && (
          <div className={styles.banner}>{paymentMessage}</div>
        )}

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.email}>{email}</p>

        <div className={styles.balanceSection}>
          <span className={styles.balanceLabel}>Token Balance</span>
          <span className={styles.balanceValue}>{balance ?? 0}</span>
        </div>

        <button
          className={styles.buyButton}
          onClick={() => router.push('/pricing')}
        >
          Buy More Tokens
        </button>

        <div className={styles.activity}>
          <h2 className={styles.activityTitle}>Recent Activity</h2>
          <p className={styles.activityPlaceholder}>
            Transaction history coming soon.
          </p>
        </div>

        <button
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </main>
  )
}

export default function AccountPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className={styles.main}>
          <p className={styles.loading}>Loading…</p>
        </main>
      }>
        <AccountContent />
      </Suspense>
    </>
  )
}
