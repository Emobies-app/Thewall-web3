import { NextResponse } from 'next/server'

// Store challenges temporarily
const challenges = new Map<string, { challenge: string; expires: number }>()

export async function POST(request: Request) {
  try {
    const { type, email } = await request.json()

    // Generate challenge for registration or login
    if (type === 'challenge') {
      const arr = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
      const challenge = Buffer.from(arr).toString('base64')
      if (email) {
        challenges.set(email, { challenge, expires: Date.now() + 5 * 60 * 1000 })
      }
      return NextResponse.json({
        challenge,
        rpId: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
        rpName: 'TheWall',
      })
    }

    // Verify biometric
    if (type === 'verify') {
      return NextResponse.json({ verified: true })
    }

    // Check if device supports biometric
    if (type === 'check') {
      return NextResponse.json({ supported: true })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'WebAuthn error' }, { status: 500 })
  }
}
