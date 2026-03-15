import { NextResponse } from 'next/server'

const COINGECKO_IDS: Record<string, string> = {
  ETH:  'ethereum',
  BNB:  'binancecoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  SOL:  'solana',
  BTC:  'bitcoin',
  ARB:  'arbitrum',
}

// MON (Monad) — mainnet not launched yet, using placeholder
const PLACEHOLDER_PRICES: Record<string, { price: number; change24h: number }> = {
  MON: { price: 0.00, change24h: 0 },
  EMC: { price: 0.01, change24h: 0 },
}

export async function GET() {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',')
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    )
    const data = await response.json()

    const prices: Record<string, { price: number; change24h: number }> = {}

    // CoinGecko prices
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      if (data[geckoId]) {
        prices[symbol] = {
          price: data[geckoId].usd || 0,
          change24h: data[geckoId].usd_24h_change || 0,
        }
      }
    }

    // Placeholder prices (MON, EMC)
    for (const [symbol, priceData] of Object.entries(PLACEHOLDER_PRICES)) {
      prices[symbol] = priceData
    }

    return NextResponse.json({ prices })
  } catch {
    // Return placeholders on error
    return NextResponse.json({
      prices: {
        ...PLACEHOLDER_PRICES,
      }
    })
  }
}
