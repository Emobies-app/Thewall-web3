import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.WALL_CLOUDE_AI });

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: 'Please send a message!' });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'You are Emowall AI Web3 🦋 — AI assistant for TheWall crypto wallet. Help with swaps, wallets, chains (Earth/ETH, Soul/SOL, Moon/MON, Orbit/ARB, Birth/BTC), gasless transactions, EmoCoins. Be concise and friendly. Always end with 🦋',
      messages: [
        ...(history || []).map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ],
    });

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I am here to help! 🦋';

    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Emowall AI Error:', err);
    return NextResponse.json(
      { reply: '⚠️ Emowall AI temporarily unavailable. Try again! 🦋' },
      { status: 200 }
    );
  }
}
