import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from './context/wallet'

export const metadata: Metadata = {
  title: '⬡ THE WALL',
  description: 'Web3 Wallet · 5 Chains · Gasless · No Seed Phrase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
