'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import styles from './page.module.css'

const GRANT_KEY = (slug: string) => `tttmp_grant_${slug}`

export default function PlayClient({ slug, title }: { slug: string; title: string }) {
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'ready' | 'denied'>('checking')

  const verify = useCallback(async () => {
    try {
      await api.getSession()
    } catch {
      router.replace(`/login?redirect=/games/${slug}`)
      return
    }

    try {
      const res = await api.checkAccess(slug)
      if (res.allowed) {
        if (res.grantId && typeof window !== 'undefined') {
          window.localStorage.setItem(GRANT_KEY(slug), res.grantId)
        }
        setState('ready')
      } else {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(GRANT_KEY(slug))
        }
        router.replace(`/games/${slug}`)
      }
    } catch {
      router.replace(`/games/${slug}`)
    }
  }, [router, slug])

  useEffect(() => {
    verify()
    const onShow = () => verify()
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [verify])

  // Warn the user that leaving/refreshing may cost them their game credit.
  useEffect(() => {
    if (state !== 'ready') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state])

  if (state !== 'ready') {
    return (
      <div className={styles.loading}>
        <p>{state === 'checking' ? 'Verifying access…' : 'Redirecting…'}</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topbar}>
        <Link href="/games" className={styles.backLink}>
          ← Back to Games
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <Link href={`/games/${slug}`} className={styles.infoLink}>
          Game Info
        </Link>
      </div>
      <iframe
        src={`/games/${slug}.html`}
        title={title}
        className={styles.frame}
        allow="fullscreen"
      />
    </div>
  )
}
