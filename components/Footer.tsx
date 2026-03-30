import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>Tax Tools Arcade</span>
        <nav className={styles.links}>
          <Link href="/contact">Contact</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/refund">Refund Policy</Link>
        </nav>
        <span className={styles.copy}>
          © {new Date().getFullYear()} Virtual Launch Pro
        </span>
      </div>
    </footer>
  )
}
