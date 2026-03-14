import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { chain, to, amount, from } = await req.json()

    if (!chain || !to || !amount || !from) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // ── ETH Send via public RPC ──
    if (chain === 'ETH') {
      const amountWei = '0x' + Math.floor(parseFloat(amount) * 1e18).toString(16)
      return NextResponse.json({
        success: true,
        chain: 'ETH',
        status: 'prepared',
        tx: {
          from,
          to,
          value: amountWei,
          note: 'Sign and broadcast via MetaMask or Alchemy Smart Wallet'
        }
      })
    }

    // ── SOL Send via Helius ──
    if (chain === 'SOL') {
      const apiKey = process.env.HELIUS_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'Helius not configured' }, { status: 500 })

      const lamports = Math.floor(parseFloat(amount) * 1e9)

      // Get recent blockhash
      const blockhashRes = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getLatestBlockhash',
          params: [{ commitment: 'finalized' }]
        })
      })
      const blockhashData = await blockhashRes.json()
      const blockhash = blockhashData.result?.value?.blockhash

      return NextResponse.json({
        success: true,
        chain: 'SOL',
        status: 'prepared',
        tx: {
          from,
          to,
          lamports,
          blockhash,
          note: 'Transaction prepared. Sign with wallet to broadcast.'
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 })
  } catch (e) {
    console.error('Send error:', e)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
