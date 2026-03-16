import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')
    const key     = process.env.ETHERSCAN_API_KEY

    if (!address || !key) return NextResponse.json({ txs: [] })

    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${key}`,
      { next: { revalidate: 60 } }
    )
    const data = await res.json()

    const txs = (data.result || []).map((tx: {
      hash: string
      from: string
      to: string
      value: string
      timeStamp: string
      gasUsed: string
      gasPrice: string
      isError: string
      functionName?: string
    }) => ({
      hash:      tx.hash,
      from:      tx.from,
      to:        tx.to,
      value:     (parseInt(tx.value) / 1e18).toFixed(6),
      time:      new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
      gas:       (parseInt(tx.gasUsed) * parseInt(tx.gasPrice) / 1e18).toFixed(6),
      status:    tx.isError === '0' ? 'success' : 'failed',
      method:    tx.functionName?.split('(')[0] || 'Transfer',
    }))

    return NextResponse.json({ txs })
  } catch {
    return NextResponse.json({ txs: [] })
  }
}
