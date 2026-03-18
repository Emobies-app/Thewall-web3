import { NextRequest, NextResponse } from 'next/server'

// ✅ Whitelist — only allowed coins
const ALLOWED_COINS: Record<string, string> = {
  ethereum:     'ethereum',
  bitcoin:      'bitcoin',
  solana:       'solana',
  arbitrum:     'arbitrum',
  binancecoin:  'binancecoin',
  monad:        'monad',
  'usd-coin':   'usd-coin',
  tether:       'tether',
}

const ALLOWED_DAYS = ['1', '7', '30', '90', '365']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // ✅ Validate coin against whitelist
    const coinParam = searchParams.get('coin') || 'ethereum'
    const coin = ALLOWED_COINS[coinParam]
    if (!coin) {
      return NextResponse.json({ error: 'Invalid coin' }, { status: 400 })
    }

    // ✅ Validate days against whitelist
    const daysParam = searchParams.get('days') || '7'
    const days = ALLOWED_DAYS.includes(daysParam) ? daysParam : '7'

    // ✅ Safe — only whitelisted values used
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinGecko error', prices: [] })
    }

    const data = await res.json()
    return NextResponse.json({ prices: data.prices || [] })

  } catch (e) {
    console.error('Chart error:', e)
    return NextResponse.json({ error: 'Chart failed', prices: [] })
  }
}
