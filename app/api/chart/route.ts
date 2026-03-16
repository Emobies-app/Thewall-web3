// app/api/chart/route.ts
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const coin = searchParams.get('coin') || 'ethereum'
    const days = searchParams.get('days') || '7'

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return NextResponse.json({
      prices: data.prices || [],
    })
  } catch {
    return NextResponse.json({ prices: [] })
  }
}
