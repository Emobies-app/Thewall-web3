import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '⬡ THE WALL · Web3 Crypto Wallet',
  description: 'TheWall — Multi-chain Web3 portfolio tracker. Kannur → Dubai.',
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
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
