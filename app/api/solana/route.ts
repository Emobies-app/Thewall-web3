import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const ALCHEMY_RPC = `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOL_API_KEY}`;

const connection = new Connection(ALCHEMY_RPC, 'confirmed');

export async function POST(req: NextRequest) {
  try {
    const { action, address, amount, to } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const pubkey = new PublicKey(address);

    if (action === 'balance') {
      const balance = await connection.getBalance(pubkey);
      return NextResponse.json({
        balance: balance / LAMPORTS_PER_SOL,
        balanceLamports: balance,
      });
    }

    if (action === 'send') {
      // This is placeholder for future full send logic
      // You can expand it later with real transaction building
      return NextResponse.json({
        success: true,
        message: 'Gasless SOL send is ready (coming in next update)',
        estimatedFee: 0.000005,
      });
    }

    // Default response
    return NextResponse.json({
      status: 'ok',
      message: 'Solana API is active',
      rpc: 'Alchemy Mainnet',
    });

  } catch (error: any) {
    console.error('Solana API error:', error);
    return NextResponse.json(
      { error: error.message || 'Solana request failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Solana API route is working',
    rpc: 'Alchemy Mainnet',
  });
}
