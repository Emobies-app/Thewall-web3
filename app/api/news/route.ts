import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest',
      { cache: 'no-store' }
    )

    const data = await res.json()

    // Debug — raw data return ചെയ്യുന്നു
    return NextResponse.json({ 
      debug: true,
      status: res.status,
      keys: Object.keys(data),
      sample: data
    })

  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
