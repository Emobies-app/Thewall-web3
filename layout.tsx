import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '⬡ THE WALL · Web3 Crypto Wallet',
  description: 'TheWall — Multi-chain Web3 portfolio tracker.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
