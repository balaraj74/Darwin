import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Darwin — Survival of the fittest startup.',
  description:
    'An AI executive board that builds startups tailored to the founder, not just the idea. Digital twin + 5-agent board + real execution.',
  keywords: 'AI startup, executive board, founder twin, digital twin, startup planning, AI agents',
  openGraph: {
    title: 'Darwin — Survival of the fittest startup.',
    description: 'Your AI Executive Board. Built Around You.',
    type: 'website',
  },
}

import BackgroundSlideshow from '../components/BackgroundSlideshow'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <BackgroundSlideshow />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
