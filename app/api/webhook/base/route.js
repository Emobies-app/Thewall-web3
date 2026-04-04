import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

export async function POST(req) {
  try {
    const rawBody = await req.text();

    let data = {};
    try {
      data = JSON.parse(rawBody);
    } catch (e) {}

    console.log('Webhook received:', data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
