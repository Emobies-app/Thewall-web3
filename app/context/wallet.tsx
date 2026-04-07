'use client'

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { useEffect, useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const ethersAdapter = new EthersAdapter()

if (typeof window !== 'undefined' && projectId) {
  createAppKit({
    adapters: [ethersAdapter as any],
    networks: [mainnet, arbitrum],
    projectId,
    metadata: {
      name: 'TheWall',
      description: 'Web3 Wallet · 5 Chains · Gasless',
      url: 'https://thewall.e-mobies.com',
      icons: ['https://thewall.e-mobies.com/favicon.ico'],
    },
    features: {
      analytics: true,
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#00e5ff',
      '--w3m-border-radius-master': '8px',
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
