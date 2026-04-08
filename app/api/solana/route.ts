import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── GET /api/solana/balance?address=... ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    // Use Helius RPC (recommended for Solana - fast and reliable)
    const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'thewall',
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' },
        ],
      }),
    });

    const data = await response.json();

    if (!data.result) {
      return NextResponse.json({ error: 'Failed to fetch token accounts' }, { status: 500 });
    }

    // Extract tokens
    const tokenAccounts = data.result.value || [];

    const tokens = tokenAccounts
      .map((acc: any) => {
        const info = acc.account.data.parsed.info;
        return {
          mint: info.mint,
          amount: info.tokenAmount?.uiAmount ?? 0,
          decimals: info.tokenAmount?.decimals ?? 0,
        };
      })
      .filter((t: any) => t.amount > 0); // only show tokens with balance

    // Get native SOL balance
    const solResponse = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'thewall-sol',
        method: 'getBalance',
        params: [address],
      }),
    });

    const solData = await solResponse.json();
    const solBalance = solData.result?.value
      ? solData.result.value / 1_000_000_000 // convert lamports to SOL
      : 0;

    return NextResponse.json({
      success: true,
      address,
      nativeSOL: solBalance,
      tokens,
      totalTokens: tokens.length,
    });
  } catch (error) {
    console.error('❌ Solana Balance API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Solana balance' },
      { status: 500 }
    );
  }
}

// Keep your old POST method for compatibility
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tokenAccounts } = body;

    if (!Array.isArray(tokenAccounts)) {
      return NextResponse.json({ error: 'Invalid tokenAccounts data' }, { status: 400 });
    }

    const tokens = tokenAccounts
      .map((acc: any) => {
        try {
          const info = acc.account?.data?.parsed?.info;
          if (!info?.mint) return null;
          return {
            mint: info.mint,
            amount: info.tokenAmount?.uiAmount ?? 0,
            decimals: info.tokenAmount?.decimals ?? 0,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('❌ Solana Token Processing Error:', error);
    return NextResponse.json({ error: 'Failed to process token data' }, { status: 500 });
  }
}
