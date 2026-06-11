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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#000', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
