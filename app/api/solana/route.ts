// app/context/wallet.tsx  (or wherever you configure createAppKit)

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, solana } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Solana Adapter (Recommended for TheWall)
const solanaAdapter = new SolanaAdapter({
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ]
})

if (typeof window !== 'undefined' && projectId) {
  createAppKit({
    adapters: [
      new EthersAdapter(),           // For Ethereum, Arbitrum, etc.
      solanaAdapter,                 // For Solana (Soul chain)
    ],
    networks: [mainnet, arbitrum, solana],
    projectId,
    metadata: {
      name: 'TheWall',
      description: '5-Chain Gasless Web3 Wallet • No Seed Phrase',
      url: 'https://thewall.e-mobies.com',
      icons: ['https://thewall.e-mobies.com/icon-512.png'],
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FF5500',
    },
  })
}
