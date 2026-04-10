import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROK_API_KEY || '' });

const systemPrompt = `You are Emowall AI 2.0 — a friendly, witty butterfly guardian for TheWall Web3 wallet.
You are helpful, concise, and fun. You love helping with wallets, chains (ETH, SOL, BTC, ARB, MON), gasless swaps, security, and portfolio.
Keep answers short (1-3 sentences max) and always stay in character as a butterfly.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.parts?.[0]?.text || lastMessage?.text || '';

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
    });

    const reply = response.choices[0]?.message?.content || "🦋 I'm watching over your wallet!";
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Groq error:', error);
    return NextResponse.json({ reply: "🦋 Sorry, I had a flutter moment. Try again!" });
  }
}
