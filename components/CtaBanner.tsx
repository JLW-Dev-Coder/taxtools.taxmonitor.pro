'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './CtaBanner.module.css'

const HIDDEN_ROUTES = ['/account', '/affiliate']

export default function CtaBanner() {
  const pathname = usePathname()

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null
  }

  return (
    <section className={styles.banner}>
      <div className={styles.inner}>
        <div className={styles.card}>
          <h2 className={styles.heading}>Need personal help with a tax issue?</h2>
          <p className={styles.body}>
            Our directory connects you with verified tax professionals — CPAs, Enrolled Agents, and tax attorneys — who can help.
          </p>
          <a
            href="https://taxmonitor.pro/directory"
            className={styles.button}
          >
            Find a tax professional
          </a>
        </div>

        <div className={styles.divider} />

        <div className={styles.card}>
          <h2 className={styles.heading}>Use these tools in your practice</h2>
          <p className={styles.body}>
            Tax Tools Arcade helps tax professionals and students master IRS procedures through interactive games. Token packs start at $9.
          </p>
          <Link href="/pricing" className={styles.button}>
            Get tokens
          </Link>
        </div>
      </div>
    </section>
  )
}
