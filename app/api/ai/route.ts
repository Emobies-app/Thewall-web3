import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message) return NextResponse.json({ reply: 'Please send a message! 🦋' });

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 300,
        messages: [
          { role: 'system', content: 'You are Emowall AI Web3 🦋 — AI assistant for TheWall crypto wallet. Help with swaps, wallets, chains (Earth/ETH, Soul/SOL, Moon/MON, Orbit/ARB, Birth/BTC), gasless transactions, EmoCoins. Be concise and friendly. Always end with 🦋' },
          ...(history || []).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I am here to help! 🦋';
    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Emowall AI Error:', err);
    return NextResponse.json({ reply: '⚠️ Emowall AI temporarily unavailable. Try again! 🦋' });
  }
}
