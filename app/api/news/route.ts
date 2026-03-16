import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/news?per_page=20',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ news: [], error: `Error: ${res.status}` })
    }

    const data = await res.json()

    const news = (data.data || []).map((item: {
      title: string
      url: string
      updated_at: number
      news_site: string
      thumb_2x?: string
    }) => ({
      title:      item.title,
      url:        item.url,
      published:  new Date(item.updated_at * 1000).toISOString(),
      source:     item.news_site,
      currencies: [],
      positive:   0,
      negative:   0,
    }))

    return NextResponse.json({ news })
  } catch (e) {
    return NextResponse.json({ news: [], error: String(e) })
  }
}
