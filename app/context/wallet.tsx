'use client'

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, solana } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection } from '@solana/web3.js'
import { useEffect, useState } from 'react'

// ── Environment variables (from .env.local) ─────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''           // your main thewllmoon key
const alchemySolKey = process.env.NEXT_PUBLIC_ALCHEMY_SOL_API_KEY || ''      // your solana.thewmoon key

// Your Gas Policy ID (TheWall Moon) - you created this
const GAS_POLICY_ID = '3678655e-9b0f-475c-b08f-889c8798730c'

// Solana Connection (using your dedicated Solana key)
const solanaConnection = new Connection(
  `https://solana-mainnet.g.alchemy.com/v2/${alchemySolKey}`,
  'confirmed'
)

const solanaAdapter = new SolanaAdapter({
  connection: solanaConnection,
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ],
})

if (typeof window !== 'undefined' && projectId && alchemyApiKey && alchemySolKey) {
  createAppKit({
    adapters: [new EthersAdapter(), solanaAdapter],
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
