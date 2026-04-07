import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import SiteFooter from '@/components/SiteFooter'
import { getAllGames } from '@/lib/games'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Tax Tools Arcade — Interactive Tax Games',
  description: 'Learn tax concepts through 21 interactive games covering notices, deductions, Circular 230, audits, and more.',
}

export default function GamesIndexPage() {
  const games = getAllGames()

  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Tax Tools Arcade</h1>
          <p className={styles.subtitle}>
            Learn tax concepts through interactive games
          </p>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {games.map((game) => (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className={`${styles.card} ${styles[`tier_${game.tier}`]}`}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.category}>{game.category}</span>
                  <span className={`${styles.tokenBadge} ${styles[`badge_${game.tier}`]}`}>
                    {game.tokenCost} tokens
                  </span>
                </div>
                <h2 className={styles.gameTitle}>{game.title}</h2>
                <p className={styles.gameDesc}>{game.description}</p>
                <span className={styles.cardCta}>View Game →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
