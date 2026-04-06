import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// ── Alchemy Signature Verify ─────────────────────────────────────────────────
function verifyAlchemySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.ALCHEMY_WEBHOOK_SECRET || '';
  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  return digest === signature;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface BaseActivity {
  fromAddress: string;
  toAddress: string;
  value: string;
  asset: string;
  hash: string;
  blockNum: string;
  category: 'external' | 'internal' | 'erc20' | 'erc721' | 'erc1155';
}

interface AlchemyWebhookPayload {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    network: string;
    activity: BaseActivity[];
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // ── Signature verification ───────────────────────────────────────────────
    const signature = req.headers.get('x-alchemy-signature') || '';
    if (process.env.ALCHEMY_WEBHOOK_SECRET && !verifyAlchemySignature(rawBody, signature)) {
      console.warn('⚠️ Invalid Alchemy signature — rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: AlchemyWebhookPayload = JSON.parse(rawBody);
    const { type, event } = payload;

    console.log(`🔵 Base Webhook [${type}] — Network: ${event?.network}`);

    // ── Handle Address Activity ──────────────────────────────────────────────
    if (type === 'ADDRESS_ACTIVITY') {
      const activities = event.activity || [];

      for (const activity of activities) {
        const { fromAddress, toAddress, value, asset, hash, category } = activity;

        console.log(`
  📦 Base Activity
  ├ Category : ${category}
  ├ Asset    : ${asset}
  ├ Value    : ${value}
  ├ From     : ${fromAddress}
  ├ To       : ${toAddress}
  └ Tx Hash  : ${hash}
        `);

        // WALLET: treasury or main
        const TREASURY = process.env.TREASURY_WALLET?.toLowerCase();
        const MAIN     = process.env.MAIN_WALLET?.toLowerCase();

        const isIncoming =
          toAddress?.toLowerCase() === TREASURY ||
          toAddress?.toLowerCase() === MAIN;

        const isOutgoing =
          fromAddress?.toLowerCase() === TREASURY ||
          fromAddress?.toLowerCase() === MAIN;

        if (isIncoming) {
          console.log(`✅ Incoming ${asset}: ${value} → TheWall wallet`);
          // TODO: trigger push notification / update UI
        }

        if (isOutgoing) {
          console.log(`📤 Outgoing ${asset}: ${value} from TheWall wallet`);
        }
      }
    }

    // ── Handle NFT Activity ──────────────────────────────────────────────────
    if (type === 'NFT_ACTIVITY') {
      console.log('🖼️ NFT activity on Base');
    }

    // ── Handle Mined Transaction ─────────────────────────────────────────────
    if (type === 'MINED_TRANSACTION') {
      console.log(`⛏️ Transaction mined on Base`);
    }

    return NextResponse.json({ success: true, chain: 'base' });

  } catch (error) {
    console.error('❌ Base Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
