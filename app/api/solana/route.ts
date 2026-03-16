import { NextResponse } from 'next/server'

const SOL_WALLET = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'

export async function GET() {
  try {
    const alchemyKey = process.env.ALCHEMY_API_KEY
    const heliusKey  = process.env.HELIUS_API_KEY

    // Use Helius first, then Alchemy, then public
    const rpcUrl = heliusKey
      ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
      : alchemyKey
      ? `https://solana-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : 'https://api.mainnet-beta.solana.com'

    // Fetch SOL balance
    const balRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getBalance',
        params: [SOL_WALLET],
      }),
    })
    const balData = await balRes.json()
    const solBalance = (balData.result?.value || 0) / 1e9

    // Fetch token accounts (JitoSOL, LST etc)
    const tokenRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 2,
        method: 'getTokenAccountsByOwner',
        params: [
          SOL_WALLET,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' },
        ],
      }),
    })
    const tokenData = await tokenRes.json()
    const tokenAccounts = tokenData.result?.value || []

    // Parse token balances
    const tokens = tokenAccounts
      .map((acc: {
        account: {
          data: {
            parsed: {
              info: {
                mint: string
                tokenAmount: {
                  uiAmount: number
                  decimals: number
                }
              }
            }
          }
        }
      }) => ({
        mint:    acc.account.data.parsed.info.mint,
        balance: acc.account.data.parsed.info.tokenAmount.uiAmount || 0,
        decimals: acc.account.data.parsed.info.tokenAmount.decimals,
      }))
      .filter((t: { balance: number }) => t.balance > 0)

    return NextResponse.json({
      solBalance,
      wallet: SOL_WALLET,
      tokens,
      rpcUsed: heliusKey ? 'Helius' : alchemyKey ? 'Alchemy' : 'Public',
    })
  } catch {
    return NextResponse.json({
      solBalance: 0,
      wallet: SOL_WALLET,
      tokens: [],
    })
  }
}
