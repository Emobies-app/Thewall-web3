import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: '⬡ THE WALL',
  description: 'Web3 Wallet · 5 Chains · Gasless · No Seed Phrase',
}

export default function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
