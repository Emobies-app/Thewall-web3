import { NextResponse } from 'next/server'

// Store email OTPs temporarily
const emailOtps = new Map<string, { otp: string; expires: number }>()

// ── GET: Generate QR code for Google Authenticator setup ──
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'user@thewall.app'

    const totpSecret = process.env.TOTP_SECRET
    if (!totpSecret) {
      return NextResponse.json({ error: 'TOTP not configured' }, { status: 500 })
    }

    const { authenticator } = await import('otplib')

    // Generate QR code URL for Google Authenticator
    const otpauth = authenticator.keyuri(
      email,
      'TheWall Web3',
      totpSecret
    )

    // Return QR data — frontend will render QR using a library
    return NextResponse.json({
      otpauth,
      secret: totpSecret.slice(0, 4) + '****', // Partially masked for display
      instructions: 'Scan this QR code with Google Authenticator',
    })
  } catch (e) {
    console.error('TOTP setup error:', e)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}

// ── POST: Verify TOTP / Email OTP ──
export async function POST(request: Request) {
  try {
    const { type, token, email, secret } = await request.json()

    // ── Verify Google Authenticator ──
    if (type === 'totp') {
      if (!token || token.length !== 6) {
        return NextResponse.json({ valid: false, error: 'Invalid token format' }, { status: 400 })
      }

      const totpSecret = secret || process.env.TOTP_SECRET
      if (!totpSecret) {
        return NextResponse.json({ valid: false, error: 'TOTP not configured' }, { status: 500 })
      }

      const { authenticator } = await import('otplib')

      // Allow 1 window tolerance (30s before/after)
      authenticator.options = { window: 1 }

      const valid = authenticator.verify({ token, secret: totpSecret })
      return NextResponse.json({ valid })
    }

    // ── Send Email OTP ──
    if (type === 'send_email_otp') {
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 })
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      emailOtps.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 })

      // TODO: Send via Resend/SendGrid in production
      console.log(`[TheWall] OTP for ${email}: ${otp}`)

      return NextResponse.json({ sent: true, message: 'OTP sent to email' })
    }

    // ── Verify Email OTP ──
    if (type === 'verify_email_otp') {
      if (!email || !token) {
        return NextResponse.json({ error: 'Email and token required' }, { status: 400 })
      }

      const record = emailOtps.get(email)
      if (!record) {
        return NextResponse.json({ valid: false, error: 'OTP not found or expired' })
      }
      if (Date.now() > record.expires) {
        emailOtps.delete(email)
        return NextResponse.json({ valid: false, error: 'OTP expired' })
      }

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
