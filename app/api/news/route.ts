import { NextResponse } from 'next/server'

// ✅ Safe HTML entity decode — no XSS risk
function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    // ✅ Remove any remaining HTML tags for safety
    .replace(/<[^>]*>/g, '')
    .trim()
}

// ✅ Safe URL validator
function safeUrl(url: string): string {
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    // Only allow https URLs
    if (parsed.protocol !== 'https:') return ''
    return trimmed
  } catch {
    return ''
  }
}

export async function GET() {
  try {
    const res = await fetch(
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json({ news: [], error: 'Feed unavailable' })
    }

    const xml = await res.text()

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

    const news = items.slice(0, 20).map(item => {
      // ✅ Extract raw text only
      const rawTitle = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                       item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const rawUrl   = item.match(/<link>(.*?)<\/link>/)?.[1] ||
                       item.match(/<guid>(.*?)<\/guid>/)?.[1] || ''
      const pubDate  = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      return {
        title:     decodeEntities(rawTitle),  // ✅ Safe decode
        url:       safeUrl(rawUrl),            // ✅ Validated URL
        published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source:    'CoinDesk',
        currencies: [],
        positive:  0,
        negative:  0,
      }
    }).filter(item => item.title && item.url) // ✅ Empty URL filtered

    return NextResponse.json({ news })

  } catch (e) {
    console.error('News error:', e)
    return NextResponse.json({ news: [], error: 'Feed error' })
  }
}
