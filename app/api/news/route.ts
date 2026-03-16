import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.CRYPTOPANIC_API_KEY

    if (!key) {
      return NextResponse.json({ news: [], error: 'No API key' })
    }

    const res = await fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=${key}&public=true`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ news: [], error: `API error: ${res.status}` })
    }

    const data = await res.json()

    const news = (data.results || []).slice(0, 20).map((item: {
      title: string
      url: string
      published_at: string
      source: { title: string }
      currencies?: { code: string }[]
      votes?: { positive: number; negative: number }
    }) => ({
      title:      item.title,
      url:        item.url,
      published:  item.published_at,
      source:     item.source?.title || 'CryptoPanic',
      currencies: item.currencies?.map((c) => c.code) || [],
      positive:   item.votes?.positive || 0,
      negative:   item.votes?.negative || 0,
    }))

    return NextResponse.json({ news })
  } catch (e) {
    return NextResponse.json({ news: [], error: String(e) })
  }
}
