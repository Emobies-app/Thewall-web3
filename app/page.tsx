'use client'
// app/approve/page.tsx
// Transaction approval page — deep linked from notification

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import TransactionApproval from '@/components/TransactionApproval'

function ApprovalContent() {
  const params = useSearchParams()
  const txId = params.get('txId') || undefined
  const role = (params.get('role') as 'owner' | 'user') || 'user'

  return (
    <TransactionApproval
      txId={txId}
      role={role}
      onApproved={(id) => console.log('✅ Approved:', id)}
      onRejected={(id) => console.log('❌ Rejected:', id)}
    />
  )
}

export default function ApprovePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030508',
        color: '#00b3f7',
        fontFamily: 'monospace',
      }}>
        Loading...
      </div>
    }>
      <ApprovalContent />
    </Suspense>
  )
}
