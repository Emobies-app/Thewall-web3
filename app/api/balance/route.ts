import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  const apiKey = process.env.ALCHEMY_API_KEY || ''
  if (!apiKey) return NextResponse.json({ address, ethBalance: 0, tokenBalances: [] })

  try {
    const res = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    })
    const data = await res.json()
    const ethBalance = parseInt(data.result, 16) / 1e18
    return NextResponse.json({ address, ethBalance, tokenBalances: [] })
  } catch {
    return NextResponse.json({ address, ethBalance: 0, tokenBalances: [] })
  }
}
