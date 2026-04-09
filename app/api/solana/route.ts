'use client'

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, solana } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection } from '@solana/web3.js'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Solana Connection using Alchemy (TheWall Moon)
const solanaConnection = new Connection(
  "https://solana-mainnet.g.alchemy.com/v2/VhwTiEp2WnHh_PNE4lOw_", 
  "confirmed"
)

const solanaAdapter = new SolanaAdapter({
  connection: solanaConnection,
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ]
})

if (typeof window !== 'undefined' && projectId) {
  createAppKit({
    adapters: [
      new EthersAdapter(),        // Ethereum, Arbitrum, Base etc.
      solanaAdapter,              // ← Solana (Soul chain)
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
