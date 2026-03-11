import { NextResponse } from 'next/server'

const MAIN_WALLET = '0xba24d47ef3f4e1000000000000000000f3f4e1'
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || ''

export async function GET() {
  try {
    const res = await fetch(
      'https://api.g.alchemy.com/data/v1/' + ALCHEMY_KEY + '/assets/tokens/by-address',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [{ address: MAIN_WALLET, networks: ['eth-mainnet', 'base-mainnet', 'matic-mainnet'] }]
        })
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Portfolio fetch failed' }, { status: 500 })
  }
}
// portfolio v3
