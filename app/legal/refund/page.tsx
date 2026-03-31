import Link from 'next/link'
import Header from '@/components/Header'
import styles from './page.module.css'

export default function RefundPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Refund Policy</h1>
        <p className={styles.updated}>Last updated: March 3, 2026</p>

        <div className={styles.section}>
          <p>
            This Refund Policy applies to purchases made on TaxTools (token packs used to unlock browser-based educational games). If you need help, use <Link href="/contact" style={{ color: 'var(--accent)' }}>Contact Support</Link>.
          </p>
        </div>

        <div className={styles.section}>
          <h2>A. What You&apos;re Buying</h2>
          <ul>
            <li><strong>Token packs</strong> can be used across any game in the arcade.</li>
            <li><strong>Tokens never expire</strong>.</li>
            <li>Games run <strong>in your browser</strong>. There are no files to download.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>B. General Rule</h2>
          <p>
            Because token packs are digital credits that deliver immediate access and can be spent right away, purchases are generally <strong>non-refundable once tokens are delivered</strong> to your account.
          </p>
        </div>

        <div className={styles.section}>
          <h2>C. When We May Approve a Refund</h2>
          <p>We may approve a refund (in full or part) in situations like:</p>
          <ul>
            <li><strong>Duplicate charge</strong> for the same purchase.</li>
            <li><strong>Unrecognized charge</strong> that appears to be unauthorized (subject to verification and payment processor rules).</li>
            <li><strong>Technical failure</strong> where tokens were purchased but never delivered to the account.</li>
            <li><strong>Service outage at purchase time</strong> that prevented access after purchase, and we cannot reasonably resolve it.</li>
          </ul>
          <p className={styles.muted}>Approvals are case-by-case and may require supporting details.</p>
        </div>

        <div className={styles.section}>
          <h2>D. When We Don&apos;t Refund</h2>
          <p>Refunds are not typically provided for:</p>
          <ul>
            <li><strong>Change of mind</strong> after tokens are delivered.</li>
            <li><strong>Partially used tokens</strong> or gameplay completed.</li>
            <li><strong>Failure to sign in</strong> to the correct account email used for purchase.</li>
            <li><strong>Browser extensions</strong> or device settings causing display issues (we&apos;ll help you troubleshoot).</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>E. How to Request a Refund</h2>
          <ol>
            <li>Submit a request through <Link href="/contact" style={{ color: 'var(--accent)' }}>Contact Support</Link>.</li>
            <li>Include your account email and the approximate purchase date/time.</li>
            <li>If available, include the receipt or last 4 digits of the card shown on the receipt.</li>
          </ol>
        </div>

        <div className={styles.section}>
          <h2>F. Policy Changes</h2>
          <p>
            We may update this policy from time to time. The &quot;Last updated&quot; date will reflect the most recent revision.
          </p>
        </div>
      </main>
    </>
  )
}
