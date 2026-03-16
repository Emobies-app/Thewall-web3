import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // CoinDesk RSS — completely free, no key!
    const res = await fetch(
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      { cache: 'no-store' }
    )

    const xml = await res.text()

    // Parse RSS XML
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

    const news = items.slice(0, 20).map(item => {
      const title   = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                      item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const url     = item.match(/<link>(.*?)<\/link>/)?.[1] || 
                      item.match(/<guid>(.*?)<\/guid>/)?.[1] || ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      const source  = 'CoinDesk'

      return {
        title:      title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
        url:        url.trim(),
        published:  pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source,
        currencies: [],
        positive:   0,
        negative:   0,
      }
    }).filter(item => item.title && item.url)

    return NextResponse.json({ news })
  } catch (e) {
    return NextResponse.json({ news: [], error: String(e) })
  }
}
