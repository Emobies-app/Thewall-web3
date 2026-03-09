import { NextResponse } from 'next/server'

// Store email OTPs temporarily (use Redis/DB in production)
const emailOtps = new Map<string, { otp: string; expires: number }>()

// Send email OTP
export async function POST(request: Request) {
  try {
    const { type, token, email, secret } = await request.json()

    // Verify Google Authenticator
    if (type === 'totp') {
      if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
      const totpSecret = secret || process.env.TOTP_SECRET
      if (!totpSecret) return NextResponse.json({ valid: true })
      const { authenticator } = await import('otplib')
      const valid = authenticator.verify({ token, secret: totpSecret })
      return NextResponse.json({ valid })
    }

    // Send Email OTP
    if (type === 'send_email_otp') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      emailOtps.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 })
      // In production: send via SendGrid/Resend
      console.log(`OTP for ${email}: ${otp}`)
      return NextResponse.json({ sent: true, message: 'OTP sent to email' })
    }

    // Verify Email OTP
    if (type === 'verify_email_otp') {
      if (!email || !token) return NextResponse.json({ error: 'Email and token required' }, { status: 400 })
      const record = emailOtps.get(email)
      if (!record) return NextResponse.json({ valid: false, error: 'OTP not found' })
      if (Date.now() > record.expires) {
        emailOtps.delete(email)
        return NextResponse.json({ valid: false, error: 'OTP expired' })
      }
      const valid = record.otp === token
      if (valid) emailOtps.delete(email)
      return NextResponse.json({ valid })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
