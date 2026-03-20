import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

const emailOtps = new Map<string, { otp: string; expires: number }>()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'user@thewall.app'
    const totpSecret = process.env.TOTP_SECRET
    if (!totpSecret) return NextResponse.json({ error: 'TOTP not configured' }, { status: 500 })
    const { authenticator } = await import('otplib')
    const otpauth = authenticator.keyuri(email, 'TheWall Web3', totpSecret)
    const qrImage = await QRCode.toDataURL(otpauth, { width: 160, margin: 2, color: { dark: '#00e5ff', light: '#060c1a' } })
    return NextResponse.json({ otpauth, qrImage, instructions: 'Scan with Google Authenticator' })
  } catch (e) {
    console.error('TOTP setup error:', e)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { type, token, email, secret } = await request.json()
    if (type === 'totp') {
      if (!token || token.length !== 6) return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 400 })
      const totpSecret = secret || process.env.TOTP_SECRET
      if (!totpSecret) return NextResponse.json({ valid: false, error: 'TOTP not configured' }, { status: 500 })
      const { authenticator } = await import('otplib')
      authenticator.options = { window: 1 }
      const valid = authenticator.verify({ token, secret: totpSecret })
      return NextResponse.json({ valid })
    }
    if (type === 'send_email_otp') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      emailOtps.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 })
      console.log(`[TheWall] OTP for ${email}: ${otp}`)
      return NextResponse.json({ sent: true })
    }
    if (type === 'verify_email_otp') {
      if (!email || !token) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
      const record = emailOtps.get(email)
      if (!record) return NextResponse.json({ valid: false, error: 'OTP not found' })
      if (Date.now() > record.expires) { emailOtps.delete(email); return NextResponse.json({ valid: false, error: 'OTP expired' }) }
      const valid = record.otp === token
      if (valid) emailOtps.delete(email)
      return NextResponse.json({ valid })
    }
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (e) {
    console.error('TOTP verify error:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
