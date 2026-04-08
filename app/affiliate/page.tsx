'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

interface AffiliateData {
  referral_code: string
  connect_status: string
  balance_pending: number
  balance_paid: number
  referral_url: string
}

interface CommissionEvent {
  platform: string
  gross_amount: number
  commission_amount: number
  status: string
  created_at: string
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function SkeletonRow() {
  return (
    <tr>
      <td><span className={styles.skeleton} /></td>
      <td><span className={styles.skeleton} /></td>
      <td><span className={styles.skeleton} /></td>
      <td><span className={styles.skeleton} /></td>
      <td><span className={styles.skeleton} /></td>
    </tr>
  )
}

export default function AffiliatePage() {
  const router = useRouter()
  const [accountId, setAccountId] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [events, setEvents] = useState<CommissionEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState('')
  const [onboardLoading, setOnboardLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSession()
      .then((data) => {
        const id = data.session.account_id
        setAccountId(id)
        return Promise.all([
          api.getAffiliate(id),
          api.getAffiliateEvents(id),
        ])
      })
      .then(([aff, evts]) => {
        setAffiliate(aff)
        setEvents(evts.events)
        setLoading(false)
      })
      .catch((err) => {
        if (err.message?.includes('401') || err.message?.includes('session')) {
          router.replace('/login?redirect=/affiliate')
        } else {
          setError('Failed to load affiliate data.')
          setLoading(false)
        }
      })
  }, [router])

  async function handleCopy() {
    if (!affiliate) return
    await navigator.clipboard.writeText(affiliate.referral_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePayout() {
    if (!affiliate) return
    setPayoutLoading(true)
    setPayoutMessage('')
    try {
      const result = await api.requestPayout(affiliate.balance_pending)
      setPayoutMessage(`Payout requested! ID: ${result.payout_id}`)
      setAffiliate((prev) => prev ? { ...prev, balance_pending: 0 } : prev)
    } catch (err) {
      setPayoutMessage(err instanceof Error ? err.message : 'Payout request failed.')
    } finally {
      setPayoutLoading(false)
    }
  }

  async function handleOnboard() {
    setOnboardLoading(true)
    try {
      const result = await api.startAffiliateOnboarding()
      window.location.href = result.onboard_url
    } catch {
      setOnboardLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <p className={styles.loadingText}>Loading…</p>
        </main>
      </>
    )
  }

  if (!affiliate) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <p className={styles.errorText}>{error || 'Could not load affiliate data.'}</p>
        </main>
      </>
    )
  }

  const canPayout =
    affiliate.balance_pending >= 1000 && affiliate.connect_status === 'active'
  const disabledReason =
    affiliate.connect_status !== 'active'
      ? 'Connect your bank account to withdraw'
      : affiliate.balance_pending < 1000
      ? 'Minimum payout is $10'
      : ''

  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Affiliate Dashboard</h1>
        {error && <p className={styles.errorText}>{error}</p>}

        {/* Section 1 — Referral Link */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Referral Link</h2>
          <div className={styles.referralRow}>
            <input
              className={styles.referralInput}
              type="text"
              value={affiliate.referral_url}
              readOnly
            />
            <button
              className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className={styles.referralHint}>
            Share this link. Earn 20% commission on every purchase your referrals make, for life.
          </p>
        </section>

        {/* Section 2 — Earnings Summary */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Earnings Summary</h2>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Available to withdraw</span>
              <span className={styles.statValue}>{formatUSD(affiliate.balance_pending)}</span>
              <span className={styles.statSubLabel}>Pending</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total earned and paid</span>
              <span className={styles.statValue}>{formatUSD(affiliate.balance_paid)}</span>
              <span className={styles.statSubLabel}>Paid Out</span>
            </div>
          </div>

          <div className={styles.payoutRow}>
            <div className={styles.payoutBtnWrapper} title={disabledReason}>
              <button
                className={styles.payoutBtn}
                onClick={handlePayout}
                disabled={!canPayout || payoutLoading}
              >
                {payoutLoading ? 'Requesting…' : 'Request Payout'}
              </button>
            </div>
            {payoutMessage && (
              <p className={styles.payoutMessage}>{payoutMessage}</p>
            )}
          </div>
        </section>

        {/* Section 3 — Stripe Connect */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Bank Account</h2>
          {affiliate.connect_status === 'active' ? (
            <div className={styles.connectedBadge}>
              ✓ Bank account connected
            </div>
          ) : (
            <div className={styles.onboardCard}>
              <h3 className={styles.onboardTitle}>Connect your bank account</h3>
              <p className={styles.onboardBody}>
                Connect via Stripe to receive commission payouts directly to your bank.
              </p>
              <button
                className={styles.onboardBtn}
                onClick={handleOnboard}
                disabled={onboardLoading}
              >
                {onboardLoading ? 'Redirecting…' : 'Connect Bank Account'}
              </button>
            </div>
          )}
        </section>

        {/* Section 4 — Commission History */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Commission History</h2>
          {events === null ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Platform</th>
                    <th>Sale Amount</th>
                    <th>Your Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </tbody>
              </table>
            </div>
          ) : events.length === 0 ? (
            <p className={styles.emptyState}>
              No commissions yet. Share your referral link to start earning.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Platform</th>
                    <th>Sale Amount</th>
                    <th>Your Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt, i) => (
                    <tr key={i}>
                      <td>{formatDate(evt.created_at)}</td>
                      <td className={styles.platformCell}>{evt.platform}</td>
                      <td>{formatUSD(evt.gross_amount)}</td>
                      <td className={styles.commissionCell}>{formatUSD(evt.commission_amount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${evt.status === 'paid' ? styles.statusPaid : styles.statusPending}`}>
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
