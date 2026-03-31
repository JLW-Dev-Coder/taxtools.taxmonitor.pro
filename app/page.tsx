import Header from '@/components/Header'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Tax Tools Arcade
          </h1>
          <p className={styles.subtitle}>
            Gamified tax education for serious professionals.
            Master IRS notices, transaction codes, and tax
            strategy — one game at a time.
          </p>
          <div className={styles.actions}>
            <a href="/games" className={styles.primary}>
              Browse Games
            </a>
            <a href="/pricing" className={styles.secondary}>
              Get Tokens
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
