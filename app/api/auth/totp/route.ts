export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    const secret = process.env.TOTP_SECRET
    if (!secret) return NextResponse.json({ valid: true })
    const { authenticator } = await import('otplib')
    const valid = authenticator.verify({ token, secret })
    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
