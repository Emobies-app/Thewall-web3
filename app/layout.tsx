import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { WalletProvider } from './context/wallet'
import { EmowallAIChat } from '@/components/EmowallButterfly'

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
