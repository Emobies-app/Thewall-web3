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
    
    // Try all possible env variable names
    const key = process.env.NEXT_PUBLIC_GEMINI_KEY 
             || process.env.GEMINI_KEY_HERE 
             || ''
    
    if (!key) {
      return NextResponse.json({ reply: '🦋 AI key not configured!' })
    }

    // Fix message format for Gemini API
    const contents = (messages || []).map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: Array.isArray(m.parts) ? m.parts : [{ text: m.parts || m.text || '' }]
    }))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
        })
      }
    )

    const data = await res.json()
    
    // Log error if any
    if (data.error) {
      console.error('Gemini error:', data.error)
      return NextResponse.json({ reply: `🦋 ${data.error.message || 'Try again!'}` })
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '🦋 No response. Try again!'
    return NextResponse.json({ reply })
    
  } catch (e: any) {
    console.error('Route error:', e)
    return NextResponse.json({ reply: '🦋 Connection error. Try again!' }, { status: 500 })
  }
}
