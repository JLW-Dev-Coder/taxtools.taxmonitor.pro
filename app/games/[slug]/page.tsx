import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllGames, getGame } from '@/lib/games'
import GameDetailClient from './GameDetailClient'

export function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) return { title: 'Game Not Found' }
  return {
    title: `${game.title} — Tax Tools Arcade`,
    description: game.description,
  }
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) notFound()
  return <GameDetailClient game={game} />
}
