import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

export async function GET(request: NextRequest) {
  if (!ALCHEMY_API_KEY) {
    return NextResponse.json({ error: 'Alchemy API key not configured' }, { status: 500 });
  }
  try {
    const res = await fetch(
      `https://api.g.alchemy.com/prices/v1/${ALCHEMY_API_KEY}/tokens/by-symbol?symbols=BTC,ETH,SOL`
    );
    if (!res.ok) throw new Error(`Alchemy API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!ALCHEMY_API_KEY) {
    return NextResponse.json({ error: 'Alchemy API key not configured' }, { status: 500 });
  }
  try {
    const body = await request.json();
    const res = await fetch(
      `https://api.g.alchemy.com/prices/v1/${ALCHEMY_API_KEY}/tokens/historical`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw new Error(`Alchemy API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
