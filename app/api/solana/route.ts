import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Solana API is ready (full support coming soon)',
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Solana route active',
  });
}
