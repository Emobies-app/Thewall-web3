import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { type } = await request.json()
    if (type === 'challenge') {
      const arr = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
      const challenge = Buffer.from(arr).toString('base64')
      return NextResponse.json({
        challenge,
        rpId: process.env.NEXT_PUBLIC_DOMAIN || 'localhost'
      })
    }
    return NextResponse.json({ verified: true })
  } catch {
    return NextResponse.json({ error: 'WebAuthn error' }, { status: 500 })
  }
}
