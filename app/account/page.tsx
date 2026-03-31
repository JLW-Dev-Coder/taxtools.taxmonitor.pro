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
      .then((data) => {
        setEmail(data.user.email)
        setBalance(data.user.balance)
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
      .then((data) => {
        if (data.status === 'complete' || data.status === 'paid') {
          setPaymentMessage(`Payment successful! ${data.credits_added} tokens added to your account.`)
          setBalance(data.balance)
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
