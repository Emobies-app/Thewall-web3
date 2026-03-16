import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // CoinGecko trending + news combined
    const res = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ news: [], error: `Error: ${res.status}` })
    }

    const data = await res.json()

    // RSS feed as backup
    const rssRes = await fetch(
      'https://feeds.feedburner.com/CoinDesk',
      { cache: 'no-store' }
    )

    // Use CryptoCompare - completely free, no key needed
    const newsRes = await fetch(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest',
      { cache: 'no-store' }
    )

    if (!newsRes.ok) {
      return NextResponse.json({ news: [] })
    }

    const newsData = await newsRes.json()

    const news = (newsData.Data || []).slice(0, 20).map((item: {
      title: string
      url: string
      published_on: number
      source: string
      categories: string
      body: string
    }) => ({
      title:      item.title,
      url:        item.url,
      published:  new Date(item.published_on * 1000).toISOString(),
      source:     item.source,
      currencies: item.categories?.split('|').slice(0, 3) || [],
      positive:   0,
      negative:   0,
    }))

    return NextResponse.json({ news })
  } catch (e) {
    return NextResponse.json({ news: [], error: String(e) })
  }
}
