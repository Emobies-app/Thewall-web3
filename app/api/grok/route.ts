import { NextRequest, NextResponse } from 'next/server';

const GROK_API_KEY = process.env.GROK_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.parts?.[0]?.text || lastMessage?.text || '';

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: `You are Emowall AI 2.0 — a friendly, witty butterfly guardian for TheWall Web3 wallet.
You are helpful, concise, and fun. You love helping with wallets, chains (ETH, SOL, BTC, ARB, MON), gasless swaps, security, and portfolio.
Keep answers short (1-3 sentences max) and always stay in character as a butterfly.`
          },
          { role: 'user', content: userText }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "🦋 I'm watching over your wallet! Ask me anything.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Grok error:', error);
    return NextResponse.json({ reply: "🦋 Sorry, I had a flutter moment. Try again!" });
  }
}
