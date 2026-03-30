'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import { GAMES } from '@/lib/games'
import styles from './page.module.css'

interface TokenPackage {
  price_id: string
  amount: number
  currency: string
  tokens: number
  recommended: boolean
  label: string
  badge?: string
  type?: string
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function TokenModal({
  packages,
  loading,
  buyingId,
  onBuy,
  onClose,
}: {
  packages: TokenPackage[]
  loading: boolean
  buyingId: string | null
  onBuy: (price_id: string) => void
  onClose: () => void
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Buy Tokens</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className={styles.modalSubtitle}>1 token = 1 game play. Tokens never expire.</p>
        {loading ? (
          <p className={styles.modalLoading}>Loading packages…</p>
        ) : packages.length === 0 ? (
          <p className={styles.modalLoading}>No packages available.</p>
        ) : (
          <div className={styles.packageGrid}>
            {packages.map((pkg) => (
              <div
                key={pkg.price_id}
                className={`${styles.packageCard} ${pkg.recommended ? styles.packageRecommended : ''}`}
              >
                {pkg.badge && <span className={styles.packageBadge}>{pkg.badge}</span>}
                {!pkg.badge && pkg.recommended && (
                  <span className={styles.packageBadge}>Popular</span>
                )}
                <div className={styles.packageTokens}>{pkg.tokens}</div>
                <div className={styles.packageTokenLabel}>tokens</div>
                <div className={styles.packagePrice}>{formatPrice(pkg.amount, pkg.currency)}</div>
                <button
                  className={styles.packageBuyBtn}
                  onClick={() => onBuy(pkg.price_id)}
                  disabled={buyingId === pkg.price_id}
                >
                  {buyingId === pkg.price_id ? 'Redirecting…' : 'Buy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function GamesPage() {
  const router = useRouter()
  const [accountId, setAccountId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [playingSlug, setPlayingSlug] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalPackages, setModalPackages] = useState<TokenPackage[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    api.getSession()
      .then((data) => {
        setLoggedIn(true)
        setAccountId(data.user.account_id)
        setBalance(data.user.balance)
      })
      .catch(() => {})
  }, [])

  async function openModal() {
    if (!loggedIn) {
      router.push('/login?redirect=/games')
      return
    }
    setShowModal(true)
    if (modalPackages.length > 0) return
    setModalLoading(true)
    try {
      const data = await api.getTokenPricing()
      const taxGamePkgs = data.prices.filter(
        (p) => !p.type || p.type === 'tax_game'
      )
      setModalPackages(taxGamePkgs)
    } catch {
      setModalPackages([])
    } finally {
      setModalLoading(false)
    }
  }

  async function handleModalBuy(price_id: string) {
    setBuyingId(price_id)
    try {
      const data = await api.purchaseTokens(price_id)
      window.location.href = data.session_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setBuyingId(null)
    }
  }

  async function handlePlay(slug: string) {
    if (!loggedIn) {
      router.push('/login?redirect=/games')
      return
    }
    if (balance !== null && balance <= 0) {
      openModal()
      return
    }

    setPlayingSlug(slug)
    setError('')
    try {
      const data = await api.grantAccess(slug)
      // Deduct 1 from local balance immediately
      setBalance((prev) => (prev !== null ? prev - 1 : prev))
      window.location.href = `/games/${slug}.html?grant_id=${data.grant_id}`
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game'
      if (message.includes('402') || message.toLowerCase().includes('insufficient')) {
        openModal()
        return
      }
      setError(message)
      setPlayingSlug(null)
    }
  }

  const noTokens = loggedIn && balance !== null && balance <= 0

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
            <div className={styles.balanceRow}>
              <span className={`${styles.badge} ${balance > 0 ? styles.badgeGreen : styles.badgeAmber}`}>
                {balance} token{balance !== 1 ? 's' : ''}
              </span>
              <button className={styles.buyTokensBtn} onClick={openModal}>
                Buy Tokens
              </button>
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {noTokens && (
          <p className={styles.tokenEmpty}>
            No tokens remaining.{' '}
            <button className={styles.tokenEmptyLink} onClick={openModal}>
              Purchase tokens to play.
            </button>
          </p>
        )}

        <div className={styles.grid}>
          {GAMES.map((game) => (
            <div key={game.slug} className={styles.card}>
              <h2 className={styles.gameTitle}>{game.title}</h2>
              <p className={styles.description}>{game.description}</p>
              <button
                className={styles.playButton}
                onClick={() => handlePlay(game.slug)}
                disabled={playingSlug === game.slug || noTokens}
              >
                {playingSlug === game.slug ? 'Loading…' : 'Play — 1 token'}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />

      {showModal && (
        <TokenModal
          packages={modalPackages}
          loading={modalLoading}
          buyingId={buyingId}
          onBuy={handleModalBuy}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
