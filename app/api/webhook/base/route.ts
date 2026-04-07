import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Alchemy Signature Verification ─────────────────────────────────────
function verifyAlchemySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.ALCHEMY_WEBHOOK_SECRET || '';
  if (!secret) {
    console.warn('⚠️ ALCHEMY_WEBHOOK_SECRET is not set');
    return false;
  }
  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody);
  return hmac.digest('hex') === signature;
}

// ── Main Webhook Handler ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-alchemy-signature') || '';

    // Verify signature
    if (process.env.ALCHEMY_WEBHOOK_SECRET && !verifyAlchemySignature(rawBody, signature)) {
      console.warn('🚫 Invalid Alchemy signature — request rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { type, event } = payload;

    console.log(`🔵 [Base Webhook] ${type} → Network: ${event?.network || 'unknown'}`);

    // ── Address Activity (Most Important) ───────────────────────────────
    if (type === 'ADDRESS_ACTIVITY') {
      const activities = event?.activity || [];

      for (const activity of activities) {
        const {
          fromAddress,
          toAddress,
          value,
          asset,
          hash,
          category,
        } = activity;

        const TREASURY = process.env.TREASURY_WALLET?.toLowerCase();
        const MAIN = process.env.MAIN_WALLET?.toLowerCase();

        const isIncoming = [TREASURY, MAIN].includes(toAddress?.toLowerCase());
        const isOutgoing = [TREASURY, MAIN].includes(fromAddress?.toLowerCase());

        console.log(`
🦋 Base Activity Detected
├─ Type     : ${category}
├─ Asset    : ${asset}
├─ Amount   : ${value}
├─ From     : ${fromAddress}
├─ To       : ${toAddress}
├─ Incoming : ${isIncoming}
├─ Outgoing : ${isOutgoing}
└─ Tx Hash  : ${hash}
        `);

        // TODO: Add push notification or real-time update here later
        if (isIncoming) {
          console.log(`✅ Incoming funds on Base → TheWall wallet`);
        }
        if (isOutgoing) {
          console.log(`📤 Outgoing transaction from TheWall wallet`);
        }
      }
    }

    // ── NFT Activity ───────────────────────────────────────────────────
    if (type === 'NFT_ACTIVITY') {
      console.log('🖼️ NFT activity detected on Base chain');
    }

    // ── Mined Transaction ──────────────────────────────────────────────
    if (type === 'MINED_TRANSACTION') {
      console.log('⛏️ Transaction successfully mined on Base');
    }

    return NextResponse.json({ 
      success: true, 
      chain: 'base',
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('❌ Base Webhook Error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
