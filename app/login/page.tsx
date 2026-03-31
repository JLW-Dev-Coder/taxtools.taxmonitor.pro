'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSession()
      .then(() => router.replace('/account'))
      .catch(() => {})
  }, [router])

  async function handleSubmit() {
    if (!email.trim()) return
    setStatus('loading')
    setError('')
    try {
      await api.requestMagicLink(email.trim())
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  function handleReset() {
    setEmail('')
    setStatus('idle')
    setError('')
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Tax Tools Arcade</h1>
          <p className={styles.subtitle}>Sign in with your email</p>

          {status === 'sent' ? (
            <div className={styles.success}>
              <span className={styles.checkmark}>✓</span>
              <h2 className={styles.successTitle}>Magic link sent!</h2>
              <p className={styles.successText}>
                Check your inbox for a sign-in link.
              </p>
              <button className={styles.resetLink} onClick={handleReset}>
                Wrong email? Try again
              </button>
            </div>
          ) : (
            <>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={status === 'loading'}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.button}
                onClick={handleSubmit}
                disabled={status === 'loading' || !email.trim()}
              >
                {status === 'loading' ? 'Sending…' : 'Send Magic Link'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}
