'use client'
import { useState } from 'react'

export default function ApprovePage() {
  const [status, setStatus] = useState('pending')
  const txId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('txId') || 'unknown'
    : 'unknown'

  const handleAction = async (action: string) => {
    setStatus(action)
    await fetch('/api/auth/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, action })
    })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#030508', fontFamily:'monospace', color:'#e8f4fd' }}>
      <div style={{ background:'#070d14', border:'1px solid rgba(0,179,247,0.3)', borderRadius:16, padding:32, maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:'2rem', color:'#00b3f7', marginBottom:16 }}>⬡</div>
        <h2 style={{ color:'#00b3f7', letterSpacing:'0.1em', marginBottom:8 }}>THE WALL</h2>
        <p style={{ color:'rgba(232,244,253,0.5)', fontSize:'0.8rem', marginBottom:24 }}>Transaction Approval Request</p>
        <div style={{ background:'#0c1520', borderRadius:8, padding:'10px 14px', marginBottom:24, fontSize:'0.72rem', color:'rgba(232,244,253,0.4)' }}>
          TX ID: {txId}
        </div>
        {status === 'pending' ? (
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={() => handleAction('approved')}
              style={{ flex:1, padding:'12px', background:'#00b3f7', border:'none', borderRadius:8, color:'#000', fontFamily:'monospace', fontWeight:700, cursor:'pointer' }}>
              ✅ Approve
            </button>
            <button onClick={() => handleAction('rejected')}
              style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(255,68,102,0.5)', borderRadius:8, color:'#ff4466', fontFamily:'monospace', cursor:'pointer' }}>
              ❌ Reject
            </button>
          </div>
        ) : (
          <div style={{ padding:16, borderRadius:8, background: status === 'approved' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,102,0.1)', color: status === 'approved' ? '#00ff88' : '#ff4466' }}>
            {status === 'approved' ? '✅ Transaction Approved' : '❌ Transaction Rejected'}
          </div>
        )}
      </div>
    </div>
  )
}
