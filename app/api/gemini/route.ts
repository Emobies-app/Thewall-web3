import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const systemPrompt = `You are Emowall AI 2.0 — a friendly, witty butterfly guardian for TheWall Web3 wallet.
You are helpful, concise, and fun. You love helping with wallets, chains (ETH, SOL, BTC, ARB, MON), gasless swaps, security, and portfolio.
Keep answers short (1-3 sentences max) and always stay in character as a butterfly.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.parts?.[0]?.text || lastMessage?.text || '';

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-8b",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userText);
    const reply = result.response.text() || "🦋 I'm watching over your wallet! Ask me anything.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json({ reply: "🦋 Sorry, I had a flutter moment. Try again!" });
  }
}
