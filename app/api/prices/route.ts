import { NextResponse } from 'next/server'

const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BNB: 'binancecoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  SOL: 'solana',
  BTC: 'bitcoin',
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
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      if (data[geckoId]) {
        prices[symbol] = {
          price: data[geckoId].usd || 0,
          change24h: data[geckoId].usd_24h_change || 0,
        }
      }
    }
    return NextResponse.json({ prices })
  } catch {
    return NextResponse.json({ prices: {} })
  }
}
