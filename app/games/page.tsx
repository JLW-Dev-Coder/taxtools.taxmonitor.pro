'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import { GAMES } from '@/lib/games'
import styles from './page.module.css'

export default function GamesPage() {
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [playingSlug, setPlayingSlug] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSession()
      .then((data) => {
        setLoggedIn(true)
        setBalance(data.user.balance)
      })
      .catch(() => {})
  }, [])

  async function handlePlay(slug: string) {
    if (!loggedIn) {
      router.push('/login?redirect=/games')
      return
    }
    if (balance !== null && balance <= 0) {
      router.push('/pricing')
      return
    }

    setPlayingSlug(slug)
    setError('')
    try {
      const data = await api.grantAccess(slug)
      window.location.href = `/games/${slug}.html?grant_id=${data.grant_id}`
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game'
      if (message.includes('402') || message.toLowerCase().includes('insufficient')) {
        router.push('/pricing')
        return
      }
      setError(message)
      setPlayingSlug(null)
    }
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Games Library</h1>
          <p className={styles.subtitle}>
            Tax education games for professionals. Each play costs 1 token.
          </p>
          {loggedIn && balance !== null && (
            <p className={styles.balance}>Your balance: {balance} tokens</p>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          {GAMES.map((game) => (
            <div key={game.slug} className={styles.card}>
              <h2 className={styles.gameTitle}>{game.title}</h2>
              <p className={styles.description}>{game.description}</p>
              <button
                className={styles.playButton}
                onClick={() => handlePlay(game.slug)}
                disabled={playingSlug === game.slug}
              >
                {playingSlug === game.slug ? 'Loading…' : 'Play — 1 token'}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
