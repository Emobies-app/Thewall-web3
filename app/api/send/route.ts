import { NextRequest, NextResponse } from 'next/server'

// ── Real ETH transaction broadcast via Alchemy/LlamaRPC ──
async function broadcastEthTx(signedTx: string): Promise<string> {
  const alchemyKey = process.env.ALCHEMY_API_KEY
  const rpcUrl = alchemyKey
    ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : 'https://eth.llamarpc.com'

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'eth_sendRawTransaction',
      params: [signedTx],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.result // tx hash
}

// ── Real SOL transaction broadcast via Helius/Alchemy ──
async function broadcastSolTx(signedTx: string): Promise<string> {
  const heliusKey = process.env.HELIUS_API_KEY
  const alchemyKey = process.env.ALCHEMY_API_KEY
  const rpcUrl = heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : `https://solana-mainnet.g.alchemy.com/v2/${alchemyKey}`

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'sendTransaction',
      params: [signedTx, { encoding: 'base64' }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.result // tx signature
}

// ── Get 0x swap quote ──
async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: string,
  fromAddress: string
) {
  // Token addresses
  const TOKEN_ADDRESSES: Record<string, string> = {
    ETH:  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    ARB:  '0x912ce59144191c1204e64559fe8253a0e49e6548',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  }

  const sellToken = TOKEN_ADDRESSES[fromToken] || fromToken
  const buyToken  = TOKEN_ADDRESSES[toToken]  || toToken
  const sellAmount = (parseFloat(amount) * 1e18).toFixed(0)

  const url = `https://api.0x.org/swap/v1/quote?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}&takerAddress=${fromAddress}`

  const res = await fetch(url, {
    headers: { '0x-api-key': process.env.ZEROX_API_KEY || '' }
  })

  if (!res.ok) throw new Error('0x quote failed')
  return await res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, chain, to, amount, from, signedTx, fromToken, toToken } = body

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    // ── Action: prepare ETH send ──
    if (action === 'prepare' && chain === 'ETH') {
      if (!to || !amount || !from) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      const alchemyKey = process.env.ALCHEMY_API_KEY
      const rpcUrl = alchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://eth.llamarpc.com'

      // Get nonce + gas price
      const [nonceRes, gasPriceRes] = await Promise.all([
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionCount', params: [from, 'latest'] }),
        }),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_gasPrice', params: [] }),
        }),
      ])

      const nonceData    = await nonceRes.json()
      const gasPriceData = await gasPriceRes.json()

      const amountWei = '0x' + Math.floor(parseFloat(amount) * 1e18).toString(16)

      return NextResponse.json({
        success: true,
        action: 'prepare',
        chain: 'ETH',
        tx: {
          from,
          to,
          value:    amountWei,
          nonce:    nonceData.result,
          gasPrice: gasPriceData.result,
          gas:      '0x5208', // 21000 standard ETH transfer
          chainId:  1,
        },
        message: 'Sign this transaction in your wallet',
      })
    }

    // ── Action: broadcast signed ETH tx ──
    if (action === 'broadcast' && chain === 'ETH') {
      if (!signedTx) return NextResponse.json({ error: 'signedTx required' }, { status: 400 })
      const txHash = await broadcastEthTx(signedTx)
      return NextResponse.json({
        success: true,
        chain: 'ETH',
        txHash,
        explorerUrl: `https://etherscan.io/tx/${txHash}`,
      })
    }

    // ── Action: prepare SOL send ──
    if (action === 'prepare' && chain === 'SOL') {
      if (!to || !amount || !from) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      const heliusKey = process.env.HELIUS_API_KEY
      const alchemyKey = process.env.ALCHEMY_API_KEY
      const rpcUrl = heliusKey
        ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
        : `https://solana-mainnet.g.alchemy.com/v2/${alchemyKey}`

      const blockhashRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getLatestBlockhash',
          params: [{ commitment: 'finalized' }],
        }),
      })
      const blockhashData = await blockhashRes.json()
      const blockhash = blockhashData.result?.value?.blockhash
      const lamports  = Math.floor(parseFloat(amount) * 1e9)

      return NextResponse.json({
        success: true,
        action: 'prepare',
        chain: 'SOL',
        tx: { from, to, lamports, blockhash },
        message: 'Sign this transaction in Phantom wallet',
      })
    }

    // ── Action: broadcast signed SOL tx ──
    if (action === 'broadcast' && chain === 'SOL') {
      if (!signedTx) return NextResponse.json({ error: 'signedTx required' }, { status: 400 })
      const txSig = await broadcastSolTx(signedTx)
      return NextResponse.json({
        success: true,
        chain: 'SOL',
        txHash: txSig,
        explorerUrl: `https://solscan.io/tx/${txSig}`,
      })
    }

    // ── Action: get swap quote ──
    if (action === 'quote') {
      if (!fromToken || !toToken || !amount || !from) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }
      const quote = await getSwapQuote(fromToken, toToken, amount, from)
      return NextResponse.json({
        success: true,
        fromToken,
        toToken,
        sellAmount: quote.sellAmount,
        buyAmount:  quote.buyAmount,
        price:      quote.price,
        guaranteedPrice: quote.guaranteedPrice,
        estimatedGas:    quote.estimatedGas,
        tx: {
          to:       quote.to,
          data:     quote.data,
          value:    quote.value,
          gasPrice: quote.gasPrice,
          gas:      quote.gas,
        },
      })
    }

    // ── Legacy: backward compat (old UI calls) ──
    if (!action && chain && to && amount && from) {
      const amountWei = '0x' + Math.floor(parseFloat(amount) * 1e18).toString(16)
      return NextResponse.json({
        success: true,
        chain,
        status: 'prepared',
        tx: { from, to, value: amountWei, note: 'Sign and broadcast' },
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('Send error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
