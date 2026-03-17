import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.WALL_CLOUDE_AI });

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: 'You are Emowall AI Web3 🦋 — assistant for TheWall crypto wallet. Help with swaps, wallets, chains (Earth/ETH, Soul/SOL, Moon/MON, Orbit/ARB, Birth/BTC), gasless transactions, EmoCoins. Be concise and friendly.',
    messages: [
      ...history.map((m: {role: string; content: string}) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ],
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : '...';
  return NextResponse.json({ reply });
}
