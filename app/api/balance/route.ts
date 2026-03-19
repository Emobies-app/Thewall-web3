import { NextResponse } from 'next/server'

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY
const HELIUS_KEY  = process.env.HELIUS_API_KEY

const RPC = {
  eth:      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  arb:      `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  monad:    `https://monad-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  polygon:  `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  op:       `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  base:     `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  scroll:   `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  sonic:    `https://sonic-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  sei:      `https://sei-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  opBnb:    `https://opbnb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  anime:    `https://anime-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  soneium:  `https://soneium-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  abstract: `https://abstract-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  crossfi:  `https://crossfi-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  metis:    `https://metis-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  stable:   `https://stable-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  // ✅ BTC via Alchemy
  btc:      `https://btc-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  // Free fallbacks
  ethFree:  'https://eth.llamarpc.com',
  arbFree:  'https://arb1.arbitrum.io/rpc',
}

async function getEvmBalance(rpcUrl: string, address: string): Promise<number> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    return data.result ? parseInt(data.result, 16) / 1e18 : 0
  } catch { return 0 }
}

async function getTokenBalances(address: string) {
  try {
    const res = await fetch(RPC.eth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getTokenBalances', params: [address, 'erc20'] }),
    })
    const data = await res.json()
    return data.result?.tokenBalances || []
  } catch { return [] }
}

async function getSolBalance(address: string): Promise<number> {
  try {
    const url = HELIUS_KEY
      ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
      : `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
    })
    const data = await res.json()
    return data.result?.value !== undefined ? data.result.value / 1e9 : 0
  } catch { return 0 }
}

// ✅ BTC balance via Alchemy Bitcoin RPC
async function getBtcBalance(address: string): Promise<number> {
  try {
    if (!ALCHEMY_KEY) return 0
    const res = await fetch(RPC.btc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getaddressinfo',
        params: [address],
      }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    // BTC balance in satoshis → BTC
    if (data.result?.balance !== undefined) {
      return data.result.balance / 1e8
    }
    return 0
  } catch { return 0 }
}

// ✅ BTC chain status check via Alchemy
async function getBtcBlockHeight(): Promise<boolean> {
  try {
    if (!ALCHEMY_KEY) return false
    const res = await fetch(RPC.btc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getblockcount',
        params: [],
      }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    return !!data.result
  } catch { return false }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address    = searchParams.get('address')
    const btcAddress = searchParams.get('btcAddress') || ''

    if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

    const SOL_ADDRESS = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'

    const [
      ethBalance, arbBalance, monadBalance,
      polygonBalance, opBalance, baseBalance,
      scrollBalance, sonicBalance, seiBalance,
      opBnbBalance, animeBalance, soneiumBalance,
      abstractBalance, crossfiBalance, metisBalance,
      solBalance, tokenBalances, btcBalance,
    ] = await Promise.all([
      getEvmBalance(ALCHEMY_KEY ? RPC.eth : RPC.ethFree, address),
      getEvmBalance(ALCHEMY_KEY ? RPC.arb : RPC.arbFree, address),
      getEvmBalance(RPC.monad, address),
      getEvmBalance(RPC.polygon, address),
      getEvmBalance(RPC.op, address),
      getEvmBalance(RPC.base, address),
      getEvmBalance(RPC.scroll, address),
      getEvmBalance(RPC.sonic, address),
      getEvmBalance(RPC.sei, address),
      getEvmBalance(RPC.opBnb, address),
      getEvmBalance(RPC.anime, address),
      getEvmBalance(RPC.soneium, address),
      getEvmBalance(RPC.abstract, address),
      getEvmBalance(RPC.crossfi, address),
      getEvmBalance(RPC.metis, address),
      getSolBalance(SOL_ADDRESS),
      getTokenBalances(address),
      btcAddress ? getBtcBalance(btcAddress) : Promise.resolve(0),
    ])

    return NextResponse.json({
      address,
      // ✅ TheWall 5 main chains
      ethBalance,
      solBalance,
      arbBalance,
      monadBalance,
      btcBalance,    // ✅ NEW — Alchemy BTC!
      // Extended chains
      polygonBalance,
      opBalance,
      baseBalance,
      scrollBalance,
      sonicBalance,
      seiBalance,
      opBnbBalance,
      animeBalance,
      soneiumBalance,
      abstractBalance,
      crossfiBalance,
      metisBalance,
      // Tokens
      tokenBalances,
      // Meta
      powered: 'Alchemy 140 Networks + BTC 🔷₿',
      timestamp: Date.now(),
    })
  } catch (e) {
    return NextResponse.json({
      error: String(e),
      ethBalance: 0, solBalance: 0,
      arbBalance: 0, btcBalance: 0,
      tokenBalances: [],
    }, { status: 500 })
  }
}
