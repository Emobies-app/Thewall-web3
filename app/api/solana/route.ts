import { NextResponse } from 'next/server'

const SOL_WALLET = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'

export async function GET() {
  const apiKey = process.env.ALCHEMY_SOL_API_KEY || ''
  if (!apiKey) return NextResponse.json({ solBalance: 0, wallet: SOL_WALLET })

  try {
    const res = await fetch(`https://solana-mainnet.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getBalance',
        params: [SOL_WALLET],
      }),
    })
    const data = await res.json()
    const solBalance = (data.result?.value || 0) / 1e9
    return NextResponse.json({ solBalance, wallet: SOL_WALLET })
  } catch {
    return NextResponse.json({ solBalance: 0, wallet: SOL_WALLET })
  }
}
