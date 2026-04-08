cat > lib/config.ts << 'EOF'
/**
 * TheWall Wallet Configuration
 * Central config for all chains, wallets & Alchemy
 */

export const ALCHEMY_CONFIG = {
  eth: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
    network: 'eth-mainnet',
  },
  sol: {
    apiKey: process.env.ALCHEMY_SOL_API_KEY || '',
    network: 'solana-mainnet',
  },
  arb: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
    network: 'arb-mainnet',
  },
  monad: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
    network: 'monad-testnet',        // change to mainnet when available
  },
  base: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
    network: 'base-mainnet',
  },
  // Bitcoin uses mempool.space for now (no Alchemy RPC yet)
} as const

export const WALLETS = {
  main:     process.env.MAIN_WALLET || '0xba24d47ef3f4e1000000000000000000f3f4e1',
  treasury: process.env.TREASURY_WALLET || '0xecbdebb62d636808a3e94183070585814127393d',
  solana:   process.env.SOLANA_WALLET || '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7',
  soul:     process.env.SOUL_WALLET_ADDRESS || '',
} as const

// ── Safe display helpers ─────────────────────────────────────────────────────

export function maskWallet(address: string, visibleChars = 5): string {
  if (!address || address.length < visibleChars * 2) return '••••••••'
  return `\( {address.slice(0, visibleChars)}... \){address.slice(-visibleChars)}`
}

/** Masked version for UI (never expose full soul address client-side) */
export const SOUL_WALLET_DISPLAY = maskWallet(WALLETS.soul || '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7')

export default {
  ALCHEMY_CONFIG,
  WALLETS,
  maskWallet,
  SOUL_WALLET_DISPLAY,
}
EOF
