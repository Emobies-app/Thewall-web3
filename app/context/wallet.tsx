'use client'

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { useEffect, useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

let appkitInitialized = false

if (typeof window !== 'undefined' && projectId && !appkitInitialized) {
  try {
    const ethersAdapter = new EthersAdapter()
    createAppKit({
      adapters: [ethersAdapter],
      networks: [mainnet, arbitrum],
      projectId,
      metadata: {
        name: 'TheWall',
        description: 'Web3 Wallet · 5 Chains · Gasless',
        url: 'https://thewall.e-mobies.com',
        icons: ['https://thewall.e-mobies.com/icon-192.png'],
      },
      features: {
        analytics: false,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#00e5ff',
        '--w3m-border-radius-master': '8px',
      },
    })
    appkitInitialized = true
  } catch (e) {
    console.error('AppKit init error:', e)
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <>{children}</>

  return <>{children}</>
}
