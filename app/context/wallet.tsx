'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { mainnet, arbitrum, optimism, base } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

const queryClient = new QueryClient()

const networks = [mainnet, arbitrum, optimism, base]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'TheWall',
    description: 'Web3 Wallet · 5 Chains · Gasless · No Seed Phrase',
    url: 'https://thewall.e-mobies.com',
    icons: ['https://thewall.e-mobies.com/favicon.ico'],
  },
  features: {
    analytics: true,
    swaps: true,
    onramp: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00e5ff',
    '--w3m-border-radius-master': '8px',
    '--w3m-font-family': 'var(--font-mono)',
  },
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export { wagmiAdapter }
