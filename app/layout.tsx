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
  description: 'Web3 Wallet · 5 Chains · Gasless · No Seed Phrase',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
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
