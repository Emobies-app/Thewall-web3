import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tokenAccounts } = body;

    // FIX: Add type to acc to avoid TS error
    const tokens = tokenAccounts.map((acc: any) => {
      const info = acc.account.data.parsed.info;

      return {
        mint: info.mint,
        amount: info.tokenAmount?.uiAmount ?? 0,
      };
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Solana API error:', error);
    return NextResponse.json(
      { error: 'Failed to process Solana data' },
      { status: 500 }
    );
  }
}
