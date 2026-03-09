import { NextResponse } from 'next/server'

const pending = new Map<string, { status: string; timestamp: number }>()

export async function POST(request: Request) {
  try {
    const { txId, action } = await request.json()
    if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 })
    pending.set(txId, { status: action || 'pending', timestamp: Date.now() })
    return NextResponse.json({ success: true, txId, status: action || 'pending' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const txId = searchParams.get('txId')
  if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 })
  const approval = pending.get(txId)
  if (!approval) return NextResponse.json({ status: 'not_found' })
  return NextResponse.json({ txId, ...approval })
}
