import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ news: [], error: `Error: ${res.status}` })
    }

    const data = await res.json()

    // Data is inside data.Data array
    const rawNews = Array.isArray(data.Data) ? data.Data : []

    const news = rawNews.slice(0, 20).map((item: {
      title: string
      url: string
      published_on: number
      source: string
      categories: string
    }) => ({
      title:      item.title,
      url:        item.url,
      published:  new Date(item.published_on * 1000).toISOString(),
      source:     item.source,
      currencies: item.categories
        ? item.categories.split('|').filter(Boolean).slice(0, 3)
        : [],
      positive:   0,
      negative:   0,
    }))

    return NextResponse.json({ news })
  } catch (e) {
    return NextResponse.json({ news: [], error: String(e) })
  }
}
