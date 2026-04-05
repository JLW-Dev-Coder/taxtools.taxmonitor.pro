import type { Metadata } from 'next'
import './globals.css'
import CtaBanner from '@/components/CtaBanner'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: {
    default: 'Tax Tools Arcade',
    template: '%s | Tax Tools Arcade',
  },
  description: 'Gamified tax education tools for tax professionals.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <CtaBanner />
        <SiteFooter />
      </body>
    </html>
  )
}
