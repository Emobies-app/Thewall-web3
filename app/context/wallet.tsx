cat > app/context/wallet.tsx << 'EOF'
'use client'

import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { useEffect, useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const ethersAdapter = new EthersAdapter()

if (typeof window !== 'undefined' && projectId) {
  createAppKit({
    adapters: [ethersAdapter as any],           // ← this fixes the error
    networks: [mainnet, arbitrum],
    projectId,
    metadata: {
      name: 'TheWall',
      description: '5-Chain Gasless Web3 Wallet',
      url: 'https://thewall.e-mobies.com',
      icons: ['https://thewall.e-mobies.com/icon-192.png'],
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
EOF
