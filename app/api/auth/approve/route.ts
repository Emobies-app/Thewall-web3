import { NextResponse } from 'next/server'

interface Approval {
  status: 'pending' | 'approved' | 'rejected'
  timestamp: number
  email?: string
  amount?: string
  to?: string
}

const pending = new Map<string, Approval>()

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // ── Alchemy Gas Manager sponsorship check ──
    // Alchemy calls this endpoint to verify sponsorship eligibility
    if (body.userOperation || body.entryPoint) {
      return NextResponse.json({
        sponsorshipPolicyId: process.env.ALCHEMY_GAS_POLICY_ID,
      })
    }

    // ── Regular transaction approval ──
    const { txId, action, email, amount, to } = body

    if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 })

    if (action === 'create') {
      pending.set(txId, {
        status: 'pending',
        timestamp: Date.now(),
        email,
        amount,
        to,
      })
      return NextResponse.json({ success: true, txId, status: 'pending' })
    }

    if (action === 'approved' || action === 'rejected') {
      const existing = pending.get(txId)
      if (!existing) return NextResponse.json({ error: 'TX not found' }, { status: 404 })

      // Check 5 min expiry
      if (Date.now() - existing.timestamp > 5 * 60 * 1000) {
        pending.delete(txId)
        return NextResponse.json({ error: 'TX expired' }, { status: 400 })
      }

      pending.set(txId, { ...existing, status: action })
      return NextResponse.json({ success: true, txId, status: action })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// Poll for approval status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const txId = searchParams.get('txId')
  if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 })

  const approval = pending.get(txId)
  if (!approval) return NextResponse.json({ status: 'not_found' })

  // Check expiry
  if (Date.now() - approval.timestamp > 5 * 60 * 1000) {
    pending.delete(txId)
    return NextResponse.json({ status: 'expired' })
  }

  return NextResponse.json({ txId, ...approval })
}
