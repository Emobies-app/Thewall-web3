export const ALCHEMY_CONFIG = {
  eth: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
    network: 'eth-mainnet',
  },
  sol: {
    apiKey: process.env.ALCHEMY_SOL_API_KEY || '',
    network: 'solana-mainnet',
  },
}

export const WALLETS = {
  main:     '0xba24d47ef3f4e1000000000000000000f3f4e1',
  treasury: '0xecbdebb62d636808a3e94183070585814127393d',
  solana:   '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7',

  // Soul wallet — full address server-side only (env var)
  // Users see masked version via maskWallet() below
  soul: process.env.SOUL_WALLET_ADDRESS || '',
}

// ── Display helpers ──────────────────────────────────────────────────────────

/**
 * Masks a wallet address for public display.
 * "5auZo...EUZs7"  →  shown to users
 * Full address      →  only available server-side / owner dashboard
 */
export function maskWallet(address: string, visibleChars = 5): string {
  if (!address || address.length < visibleChars * 2) return '••••••••'
  return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`
}

/**
 * Soul wallet — masked for UI display.
 * Import this in client components instead of WALLETS.soul
 */
export const SOUL_WALLET_DISPLAY = maskWallet(
  process.env.SOUL_WALLET_ADDRESS || '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'
)
// → "5auZo...EUZs7"
