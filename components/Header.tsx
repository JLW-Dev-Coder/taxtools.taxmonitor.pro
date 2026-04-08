'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from './Header.module.css'

export default function Header() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    api.getSession()
      .then(async (data) => {
        setLoggedIn(true)
        try {
          const bal = await api.getTokenBalance(data.session.account_id)
          setBalance(bal.balance.tax_game_tokens)
        } catch {
          setBalance(null)
        }
      })
      .catch(() => {
        setLoggedIn(false)
      })
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Tax Tools Arcade
        </Link>
        <nav className={styles.nav}>
          <Link href="/games">Games</Link>
          <Link href="/pricing">Tokens</Link>
          {loggedIn ? (
            <>
              <Link href="/affiliate">Affiliate</Link>
              <Link href="/account" className={styles.balance}>
                🪙 {balance ?? '—'}
              </Link>
              <button
                className={styles.logout}
                onClick={() => api.logout().then(() => window.location.reload())}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.cta}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
