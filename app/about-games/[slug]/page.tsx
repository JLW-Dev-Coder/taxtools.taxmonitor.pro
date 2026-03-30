import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { GAMES } from '@/lib/games'
import styles from './page.module.css'

export function generateStaticParams() {
  return [
    { slug: 'circular-230-quest' },
    { slug: 'irs-notice-jackpot' },
    { slug: 'irs-notice-showdown' },
    { slug: 'irs-tax-detective' },
    { slug: 'match-the-tax-notice' },
    { slug: 'tax-deadline-master' },
    { slug: 'tax-deduction-quest' },
    { slug: 'tax-document-hunter' },
    { slug: 'tax-jargon-game' },
    { slug: 'tax-strategy-adventures' },
    { slug: 'tax-tips-refund-boost' },
  ]
}

export default async function AboutGamePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = GAMES.find((g) => g.slug === slug)

  if (!game) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>{game.title}</h1>
        <p className={styles.description}>{game.description}</p>

        <div className={styles.imagePlaceholder}>
          Screenshot coming soon
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>How to Play</h2>
          <p className={styles.instructions}>{game.instructions}</p>
        </div>

        <p className={styles.cost}>
          Each play costs {game.tokenCost} tokens.
        </p>

        <div className={styles.actions}>
          <Link href="/games" className={styles.playButton}>
            Play Now — {game.tokenCost} Tokens
          </Link>
          <Link href="/pricing" className={styles.tokenLink}>
            Get Tokens
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
