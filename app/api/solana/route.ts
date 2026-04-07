import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TokenAccount {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount?: {
            uiAmount: number;
          };
        };
      };
    };
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tokenAccounts } = body;

    if (!Array.isArray(tokenAccounts)) {
      return NextResponse.json(
        { error: 'Invalid tokenAccounts data' },
        { status: 400 }
      );
    }

    const tokens = tokenAccounts
      .map((acc: TokenAccount) => {
        try {
          const info = acc.account?.data?.parsed?.info;
          if (!info?.mint) return null;

          return {
            mint: info.mint,
            amount: info.tokenAmount?.uiAmount ?? 0,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean); // remove null entries

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('❌ Solana Token API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Solana token data' },
      { status: 500 }
    );
  }
}
