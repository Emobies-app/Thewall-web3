import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { WalletProvider } from './context/wallet'
import dynamic from 'next/dynamic'

// ── Load butterfly client-side only (no SSR) ──
const EmowallAIChat = dynamic(
  () => import('@/components/EmowallButterfly').then(m => m.EmowallAIChat || m.default),
  { ssr: false }
)

export const metadata: Metadata = {
  title: '⬡ THE WALL',
  description: '5-Chain Web3 Wallet — ETH · SOL · BTC · ARB · MON · Gasless · No Seed Phrase',
  manifest: '/manifest.json',
  themeColor: '#627eea',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TheWall',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/icon-192.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
          <EmowallAIChat />
        </WalletProvider>
      </body>
    </html>
  )
}
