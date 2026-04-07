import { notFound } from 'next/navigation'
import { getAllGames, getGame } from '@/lib/games'
import PlayClient from './PlayClient'

export function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }))
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) notFound()
  return <PlayClient slug={game.slug} title={game.title} />
}
