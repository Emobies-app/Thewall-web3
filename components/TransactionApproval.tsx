'use client'
import { useState } from 'react'

interface Props {
  txId: string
  amount?: string
  to?: string
  onApproved: () => void
  onRejected: () => void
}

export default function TransactionApproval({ txId, amount, to, onApproved, onRejected }: Props) {
  const [step, setStep] = useState<'review' | 'totp' | 'biometric' | 'done'>('review')
  const [totp, setTotp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    setError('')
    try {
      await fetch('/api/auth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId, action: 'approved' })
      })
      setStep('totp')
    } catch {
      setError('Approval failed. Try again.')
    }
    setLoading(false)
  }

  const handleTotp = async () => {
    if (totp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totp })
      })
      const data = await res.json()
      if (data.valid) {
        setStep('biometric')
      } else {
        setError('Invalid code. Try again.')
      }
    } catch {
      setError('Verification failed.')
    }
    setLoading(false)
  }

  const handleBiometric = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/webauthn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'verify' })
      })
      const data = await res.json()
      if (data.verified) {
        setStep('done')
        onApproved()
      }
    } catch {
      setError('Biometric failed.')
    }
    setLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    wrap: { background:'#070d14', border:'1px solid rgba(0,179,247,0.3)', borderRadius:16, padding:24, maxWidth:380, width:'100%', fontFamily:'monospace', color:'#e8f4fd' },
    title: { color:'#00b3f7', fontSize:'0.8rem', letterSpacing:'0.1em', marginBottom:16 },
    row: { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(0,179,247,0.08)', fontSize:'0.72rem' },
    label: { color:'rgba(232,244,253,0.4)' },
    val: { color:'#e8f4fd' },
    btn: { width:'100%', padding:12, background:'#00b3f7', border:'none', borderRadius:8, color:'#000', fontFamily:'monospace', fontWeight:700, cursor:'pointer', marginTop:16 },
    btnRed: { width:'100%', padding:12, background:'transparent', border:'1px solid rgba(255,68,102,0.4)', borderRadius:8, color:'#ff4466', fontFamily:'monospace', cursor:'pointer', marginTop:8 },
    input: { width:'100%', padding:'10px 12px', background:'#0c1520', border:'1px solid rgba(0,179,247,0.3)', borderRadius:8, color:'#e8f4fd', fontFamily:'monospace', fontSize:'1rem', letterSpacing:'0.2em', textAlign:'center' as const, marginTop:12, outline:'none' },
    error: { color:'#ff4466', fontSize:'0.72rem', marginTop:8, textAlign:'center' as const },
    step: { fontSize:'0.65rem', color:'rgba(232,244,253,0.3)', textAlign:'center' as const, marginBottom:12 },
  }

  return (
    <div style={s.wrap}>
      {step === 'review' && (
        <>
          <div style={s.title}>⬡ TRANSACTION REQUEST</div>
          <div style={s.step}>STEP 1 OF 3 · REVIEW</div>
          {amount && <div style={s.row}><span style={s.label}>Amount</span><span style={s.val}>{amount}</span></div>}
          {to && <div style={s.row}><span style={s.label}>To</span><span style={s.val}>{to.slice(0,10)}...{to.slice(-6)}</span></div>}
          <div style={s.row}><span style={s.label}>TX ID</span><span style={s.val}>{txId.slice(0,12)}...</span></div>
          <button style={s.btn} onClick={handleApprove} disabled={loading}>
            {loading ? 'Processing...' : '✅ Approve'}
          </button>
          <button style={s.btnRed} onClick={onRejected}>❌ Reject</button>
          {error && <div style={s.error}>{error}</div>}
        </>
      )}

      {step === 'totp' && (
        <>
          <div style={s.title}>🔐 AUTHENTICATOR CODE</div>
          <div style={s.step}>STEP 2 OF 3 · GOOGLE AUTHENTICATOR</div>
          <p style={{ fontSize:'0.75rem', color:'rgba(232,244,253,0.5)', marginBottom:8 }}>Enter your 6-digit code</p>
          <input style={s.input} type="text" maxLength={6} value={totp}
            onChange={e => setTotp(e.target.value.replace(/\D/g,'').slice(0,6))}
            onKeyDown={e => e.key === 'Enter' && handleTotp()}
            placeholder="000000" autoFocus />
          <button style={s.btn} onClick={handleTotp} disabled={loading || totp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code →'}
          </button>
          {error && <div style={s.error}>{error}</div>}
        </>
      )}

      {step === 'biometric' && (
        <>
          <div style={s.title}>👆 BIOMETRIC VERIFY</div>
          <div style={s.step}>STEP 3 OF 3 · FACE ID / FINGERPRINT</div>
          <p style={{ fontSize:'0.75rem', color:'rgba(232,244,253,0.5)', margin:'16px 0' }}>Use Face ID or fingerprint to confirm</p>
          <button style={s.btn} onClick={handleBiometric} disabled={loading}>
            {loading ? 'Verifying...' : '👆 Authenticate'}
          </button>
          {error && <div style={s.error}>{error}</div>}
        </>
      )}

      {step === 'done' && (
        <div style={{ textAlign:'center', padding:16 }}>
          <div style={{ fontSize:'2rem', marginBottom:12 }}>✅</div>
          <div style={{ color:'#00ff88', fontWeight:700 }}>Transaction Approved!</div>
        </div>
      )}
    </div>
  )
}
