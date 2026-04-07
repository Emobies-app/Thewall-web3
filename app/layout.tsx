import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

import { WalletProvider } from './context/wallet'
import SWRegister from './sw-register'
import EmowallAIChatWrapper from '@/components/EmowallAIChatWrapper'

export const metadata: Metadata = {
  title: '⬡ THE WALL',
  description: '5-Chain Gasless Web3 Wallet — No Seed Phrase • Emowall AI Guardian',
  manifest: '/manifest.json',
  themeColor: '#FF5500',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TheWall',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF5500" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TheWall" />
      </head>
      <body className="bg-[#07080B]">
        <WalletProvider>
          <SWRegister />
          {children}
          <EmowallAIChatWrapper />
        </WalletProvider>
      </body>
    </html>
  )
}
