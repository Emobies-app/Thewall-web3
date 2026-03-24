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
    const key = process.env.WALL_CLOUDE_AI || ''

    if (!key) {
      return NextResponse.json({ reply: '🦋 AI not configured!' })
    }

    // Convert messages to Claude format
    const claudeMsgs = (messages || []).map((m: any) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts?.[0]?.text || m.text || ''
    })).filter((m: any) => m.content)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: claudeMsgs.length > 0 ? claudeMsgs : [{ role: 'user', content: 'Hello' }]
      })
    })

    const data = await res.json()

    if (data.error) {
      console.error('Claude error:', data.error)
      return NextResponse.json({ reply: '🦋 ' + (data.error.message || 'Try again!') })
    }

    const reply = data?.content?.[0]?.text || '🦋 Sorry, try again!'
    return NextResponse.json({ reply })

  } catch (e: any) {
    console.error('Route error:', e)
    return NextResponse.json({ reply: '🦋 Connection error. Try again!' }, { status: 500 })
  }
}
