import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { WalletProvider } from './context/wallet'
import SWRegister from './sw-register'
import EmowallAIChatWrapper from '@/components/EmowallAIChatWrapper'

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#030508" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TheWall" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[SW] registered', reg.scope); })
                    .catch(function(err) { console.error('[SW] error', err); });
                });
              }
            `
          }}
        />
      </head>
      <body>
        <WalletProvider>
          <SWRegister />
          {children}
          <EmowallAIChatWrapper />
        </WalletProvider>
      </body>
    </html>
  )
}
