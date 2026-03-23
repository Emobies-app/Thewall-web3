import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Emowall AI, the intelligent guardian of TheWall Web3 wallet app built by Divin (Dwin Universe).
You help users with:
- ETH, SOL, BTC, ARB, MON blockchain queries
- Wallet security (5FA - Earth/Soul/Moon/Orbit/Birth protection)
- Transaction help and gas fees
- Web3 education in simple language
- TheWall app features

Be friendly, short, clear. Max 2-3 sentences per reply.
Always end response with 🦋`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const key = process.env.GEMINI_KEY_HERE || process.env.NEXT_PUBLIC_GEMINI_KEY || ''
    
    if (!key) {
      return NextResponse.json({ reply: '🦋 AI not configured yet. Coming soon!' })
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages,
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
        })
      }
    )

    const data = await res.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '🦋 Sorry, try again!'
    return NextResponse.json({ reply })
  } catch (e) {
    return NextResponse.json({ reply: '🦋 Connection error. Try again!' }, { status: 500 })
  }
}
