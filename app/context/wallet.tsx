'use client'

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, solana } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection } from '@solana/web3.js'
import { useEffect, useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''

// Your Gas Policy ID (TheWall Moon)
const GAS_POLICY_ID = '3678655e-9b0f-475c-b08f-889c8798730c'

// Solana Connection
const solanaConnection = new Connection(
  `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  "confirmed"
)

const solanaAdapter = new SolanaAdapter({
  connection: solanaConnection,
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ]
})

if (typeof window !== 'undefined' && projectId && alchemyApiKey) {
  createAppKit({
    adapters: [
      new EthersAdapter(),           // Ethereum, Arbitrum, Base, etc.
      solanaAdapter,                 // Solana (Soul chain)
    ],
    networks: [mainnet, arbitrum, solana],
    projectId,
    metadata: {
      name: 'TheWall',
      description: '5-Chain Gasless Web3 Wallet • No Seed Phrase • Emowall AI',
      url: 'https://thewall.e-mobies.com',
      icons: ['https://thewall.e-mobies.com/icon-512.png'],
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FF5500',
    },
    // Gas Manager integration (makes all transactions gasless)
    features: {
      gasless: {
        enabled: true,
        policyId: GAS_POLICY_ID,
      }
    }
  })
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <>{children}</>

  return <>{children}</>
}
