'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import SiteFooter from '@/components/SiteFooter'
import FaqItem from '@/components/FaqItem'
import { api, type TokenPackage, type TokenPackSku } from '@/lib/api'
import type { Game } from '@/lib/games'
import styles from './page.module.css'

const GRANT_KEY = (slug: string) => `tttmp_grant_${slug}`

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

const FAQS = [
  {
    q: 'Do tokens expire?',
    a: 'No. Tokens in your account do not expire and can be used on any game at any time.',
  },
  {
    q: 'How does spending work?',
    a: 'When you unlock a game, the token cost is deducted once. Reloads during an active session do not charge you again.',
  },
  {
    q: 'Is this tax advice?',
    a: 'No. These games are for educational purposes only and are not tax, legal, or financial advice. They are not a substitute for professional representation.',
  },
  {
    q: 'Why do I need to sign in?',
    a: 'Sign-in lets us track your token balance and active game sessions securely across devices.',
  },
  {
    q: 'What if I need real help with a tax issue?',
    a: 'Contact a licensed tax professional (CPA, EA, or attorney). You can also visit our help center for resources.',
  },
]

export default function GameDetailClient({ game }: { game: Game }) {
  const router = useRouter()

  // Auth / balance state
  const [loggedIn, setLoggedIn] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [hasGrant, setHasGrant] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Modals
  const [showConfirm, setShowConfirm] = useState(false)
  const [showBuy, setShowBuy] = useState(false)
  const [buyPackages, setBuyPackages] = useState<TokenPackage[]>([])
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  // Demo state
  const [demoScreen, setDemoScreen] = useState<'menu' | 'quiz' | 'results'>('menu')
  const [demoIndex, setDemoIndex] = useState(0)
  const [demoScore, setDemoScore] = useState(0)
  const [demoAnswer, setDemoAnswer] = useState<number | null>(null)

  const checkSession = useCallback(async () => {
    try {
      const data = await api.getSession()
      setLoggedIn(true)
      const bal = await api.getTokenBalance(data.session.account_id)
      setBalance(bal.balance.tax_game_tokens)
    } catch {
      setLoggedIn(false)
      setBalance(null)
    }
  }, [])

  const checkGrant = useCallback(async () => {
    if (typeof window === 'undefined') return
    try {
      const res = await api.checkAccess(game.slug)
      setHasGrant(!!res.allowed)
      if (res.allowed && res.grantId) {
        window.localStorage.setItem(GRANT_KEY(game.slug), res.grantId)
      } else {
        window.localStorage.removeItem(GRANT_KEY(game.slug))
      }
    } catch {
      setHasGrant(false)
    }
  }, [game.slug])

  useEffect(() => {
    checkSession().then(() => checkGrant())

    // Checkout return
    const url = new URL(window.location.href)
    const sessionId = url.searchParams.get('session_id')
    if (sessionId) {
      api.getCheckoutStatus(sessionId)
        .then(() => checkSession())
        .catch(() => {})
        .finally(() => {
          url.searchParams.delete('session_id')
          window.history.replaceState({}, '', url.toString())
        })
    }

    const onShow = () => {
      checkSession()
      checkGrant()
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [checkSession, checkGrant])

  async function loadBuyPackages() {
    if (buyPackages.length > 0) return
    setBuyLoading(true)
    try {
      const data = await api.getTokenPackages()
      setBuyPackages(data.packages)
    } catch {
      setBuyPackages([])
    } finally {
      setBuyLoading(false)
    }
  }

  async function preflightUnlock() {
    setError('')
    if (!loggedIn) {
      router.push(`/login?redirect=/games/${game.slug}`)
      return
    }
    if (hasGrant) {
      router.push(`/games/${game.slug}/play`)
      return
    }
    if (balance !== null && balance < game.tokenCost) {
      setShowBuy(true)
      loadBuyPackages()
      return
    }
    setShowConfirm(true)
  }

  async function confirmSpend() {
    setBusy(true)
    setError('')
    try {
      const data = await api.spendTokens({
        amount: game.tokenCost,
        slug: game.slug,
        reason: 'arcade_play',
      })
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GRANT_KEY(game.slug), data.grantId)
      }
      setHasGrant(true)
      if (balance !== null) setBalance(balance - game.tokenCost)
      setShowConfirm(false)
      router.push(`/games/${game.slug}/play`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unlock failed'
      if (msg.includes('402') || msg.toLowerCase().includes('insufficient')) {
        setShowConfirm(false)
        setShowBuy(true)
        loadBuyPackages()
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleBuy(sku: TokenPackSku) {
    setBuyingId(sku)
    try {
      const data = await api.createCheckoutSession(sku)
      window.location.href = data.checkout_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setBuyingId(null)
    }
  }

  // Demo logic
  function openDemo() {
    setShowDemo(true)
    setDemoScreen('menu')
    setDemoIndex(0)
    setDemoScore(0)
    setDemoAnswer(null)
  }
  function startQuiz() {
    setDemoScreen('quiz')
    setDemoIndex(0)
    setDemoScore(0)
    setDemoAnswer(null)
  }
  function answerDemo(i: number) {
    if (demoAnswer !== null) return
    setDemoAnswer(i)
    const q = game.demoQuestions[demoIndex]
    if (i === q.correct) setDemoScore((s) => s + 1)
  }
  function nextDemo() {
    if (demoIndex + 1 >= game.demoQuestions.length) {
      setDemoScreen('results')
    } else {
      setDemoIndex((i) => i + 1)
      setDemoAnswer(null)
    }
  }
  function closeDemoAndUnlock() {
    setShowDemo(false)
    preflightUnlock()
  }

  const unlockLabel = hasGrant
    ? 'Resume Play'
    : `Unlock & Play (${game.tokenCost} tokens)`

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Hero */}
        <section className={`${styles.hero} ${styles[`hero_${game.tier}`]}`}>
          <div className={styles.heroInner}>
            <Link href="/games" className={styles.backLink}>
              ← All Games
            </Link>
            <span className={styles.categoryChip}>{game.category}</span>
            <h1 className={styles.title}>{game.title}</h1>
            <p className={styles.description}>{game.description}</p>
            <div className={styles.heroActions}>
              <button
                className={styles.primaryBtn}
                onClick={preflightUnlock}
                disabled={busy}
              >
                {busy ? 'Working…' : unlockLabel}
              </button>
              <button className={styles.secondaryBtn} onClick={openDemo}>
                Try Demo
              </button>
            </div>
            <div className={styles.heroMeta}>
              <span className={`${styles.tokenChip} ${styles[`chip_${game.tier}`]}`}>
                {game.tokenCost} tokens per play
              </span>
              {loggedIn && balance !== null && (
                <span className={styles.balanceChip}>Balance: {balance} tokens</span>
              )}
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </section>

        {/* What You'll Learn */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What You&apos;ll Learn</h2>
          <div className={styles.featureGrid}>
            {game.features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <span className={styles.featureNum}>{i + 1}</span>
                <p>{f}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preview / Demo */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Try the Demo</h2>
          <p className={styles.sectionLead}>
            Get a feel for {game.title} with 2 free sample questions. No sign-in required.
          </p>
          <div className={styles.demoCta}>
            <button className={styles.primaryBtn} onClick={openDemo}>
              Try Demo
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={preflightUnlock}
              disabled={busy}
            >
              {unlockLabel}
            </button>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>1</div>
              <h3>Sign In</h3>
              <p>Use a magic link — no passwords to remember.</p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>2</div>
              <h3>Confirm Spend</h3>
              <p>
                Spend {game.tokenCost} tokens once to unlock a session. Reloads don&apos;t charge you again.
              </p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNum}>3</div>
              <h3>Play</h3>
              <p>Launch the game in full-screen. Come back and resume any time.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>FAQ</h2>
          <div className={styles.faqList}>
            {FAQS.map((f) => (
              <FaqItem key={f.q} question={f.q} answer={f.a} />
            ))}
          </div>
        </section>

        {/* Trust / Disclaimer */}
        <section className={styles.disclaimer}>
          <p>
            <strong>Education only.</strong> Tax Tools Arcade games are designed for learning
            and credential prep. They are not tax advice, not legal advice, and not a substitute
            for representation by a licensed tax professional.
          </p>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <h2>Ready to play?</h2>
          <div className={styles.heroActions}>
            <button
              className={styles.primaryBtn}
              onClick={preflightUnlock}
              disabled={busy}
            >
              {busy ? 'Working…' : unlockLabel}
            </button>
            <Link href="/games" className={styles.secondaryBtn}>
              View All Games
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />

      {/* Confirm Spend Modal */}
      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm Unlock</h3>
            <p className={styles.modalLead}>
              Unlock <strong>{game.title}</strong> for{' '}
              <strong>{game.tokenCost} tokens</strong>?
            </p>
            <p className={styles.modalNote}>
              You&apos;ll only be charged once. Reloads won&apos;t charge you again while the
              session is active.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowConfirm(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={confirmSpend}
                disabled={busy}
              >
                {busy ? 'Unlocking…' : `Confirm & Play`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Tokens Modal */}
      {showBuy && (
        <div className={styles.overlay} onClick={() => setShowBuy(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Buy Tokens</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowBuy(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className={styles.modalLead}>
              Not enough tokens. Pick a pack to continue.
            </p>
            {buyLoading ? (
              <p className={styles.modalNote}>Loading packages…</p>
            ) : buyPackages.length === 0 ? (
              <p className={styles.modalNote}>No packages available.</p>
            ) : (
              <div className={styles.packageGrid}>
                {buyPackages.map((pkg) => (
                  <div
                    key={pkg.sku}
                    className={`${styles.packageCard} ${pkg.recommended ? styles.packageRecommended : ''}`}
                  >
                    {pkg.badge && <span className={styles.packageBadge}>{pkg.badge}</span>}
                    {!pkg.badge && pkg.recommended && (
                      <span className={styles.packageBadge}>Popular</span>
                    )}
                    <div className={styles.packageTokens}>{pkg.tokens}</div>
                    <div className={styles.packageTokenLabel}>tokens</div>
                    <div className={styles.packagePrice}>
                      {formatPrice(pkg.amount, pkg.currency)}
                    </div>
                    <button
                      className={styles.primaryBtn}
                      onClick={() => handleBuy(pkg.sku)}
                      disabled={buyingId === pkg.sku}
                    >
                      {buyingId === pkg.sku ? 'Redirecting…' : 'Buy'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demo Modal */}
      {showDemo && (
        <div className={styles.overlay} onClick={() => setShowDemo(false)}>
          <div
            className={`${styles.modal} ${styles.demoModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{game.title} — Demo</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowDemo(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {demoScreen === 'menu' && (
              <div className={styles.demoMenu}>
                <p className={styles.modalLead}>
                  Answer {game.demoQuestions.length} free questions to try{' '}
                  {game.title}. See how you score, then unlock the full game.
                </p>
                <button className={styles.primaryBtn} onClick={startQuiz}>
                  Start Demo
                </button>
              </div>
            )}

            {demoScreen === 'quiz' && (
              <div className={styles.demoQuiz}>
                <div className={styles.demoProgress}>
                  Question {demoIndex + 1} of {game.demoQuestions.length}
                </div>
                <h4 className={styles.demoQuestion}>
                  {game.demoQuestions[demoIndex].question}
                </h4>
                <div className={styles.demoOptions}>
                  {game.demoQuestions[demoIndex].options.map((opt, i) => {
                    const isSelected = demoAnswer === i
                    const isCorrect = i === game.demoQuestions[demoIndex].correct
                    const showResult = demoAnswer !== null
                    let cls = styles.demoOption
                    if (showResult && isCorrect) cls += ' ' + styles.demoOptionCorrect
                    else if (showResult && isSelected) cls += ' ' + styles.demoOptionWrong
                    return (
                      <button
                        key={i}
                        className={cls}
                        onClick={() => answerDemo(i)}
                        disabled={demoAnswer !== null}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {demoAnswer !== null && (
                  <div className={styles.demoFeedback}>
                    <p
                      className={
                        demoAnswer === game.demoQuestions[demoIndex].correct
                          ? styles.demoCorrect
                          : styles.demoWrong
                      }
                    >
                      {demoAnswer === game.demoQuestions[demoIndex].correct
                        ? 'Correct!'
                        : 'Not quite.'}
                    </p>
                    <p className={styles.demoExplanation}>
                      {game.demoQuestions[demoIndex].explanation}
                    </p>
                    <button className={styles.primaryBtn} onClick={nextDemo}>
                      {demoIndex + 1 >= game.demoQuestions.length ? 'See Results' : 'Next'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {demoScreen === 'results' && (
              <div className={styles.demoResults}>
                <h4>Demo Complete</h4>
                <p className={styles.demoScore}>
                  {demoScore} / {game.demoQuestions.length} correct
                </p>
                <p className={styles.modalLead}>
                  Ready for the full game? Unlock it for {game.tokenCost} tokens.
                </p>
                <div className={styles.modalActions}>
                  <button className={styles.secondaryBtn} onClick={startQuiz}>
                    Try Again
                  </button>
                  <button className={styles.primaryBtn} onClick={closeDemoAndUnlock}>
                    Unlock & Play
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
