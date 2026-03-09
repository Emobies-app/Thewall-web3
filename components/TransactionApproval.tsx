'use client'
import { useState, useEffect } from 'react'

interface Props {
  txId: string
  amount?: string
  to?: string
  email?: string
  onApproved: () => void
  onRejected: () => void
}

type Layer = 'totp' | 'phone' | 'email_otp' | 'biometric' | 'done'

export default function TransactionApproval({ txId, amount, to, email, onApproved, onRejected }: Props) {
  const [layer, setLayer] = useState<Layer>('totp')
  const [totp, setTotp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phoneStatus, setPhoneStatus] = useState<'waiting' | 'approved' | 'rejected'>('waiting')
  const [hasBiometric, setHasBiometric] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setHasBiometric(available)
      } catch {
        setHasBiometric(false)
      }
    }
    checkBiometric()
  }, [])

  // Create TX approval request on mount
  useEffect(() => {
    fetch('/api/auth/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, action: 'create', email, amount, to })
    })
  }, [txId, email, amount, to])

  // Poll phone approval status
  useEffect(() => {
    if (layer !== 'phone') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/approve?txId=${txId}`)
        const data = await res.json()
        if (data.status === 'approved') {
          setPhoneStatus('approved')
          clearInterval(interval)
          setTimeout(() => {
            if (email) sendEmailOtp()
            setLayer('email_otp')
          }, 1000)
        }
        if (data.status === 'rejected') {
          setPhoneStatus('rejected')
          clearInterval(interval)
          onRejected()
        }
      } catch { }
    }, 2000)
    return () => clearInterval(interval)
  }, [layer, txId])

  const sendEmailOtp = async () => {
    try {
      await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'send_email_otp', email })
      })
      setOtpSent(true)
    } catch { }
  }

  // Layer 1: Google Authenticator
  const handleTotp = async () => {
    if (totp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'totp', token: totp })
      })
      const data = await res.json()
      if (data.valid) {
        setLayer('phone')
      } else {
        setError('Invalid code. Try again.')
      }
    } catch {
      setError('Verification failed.')
    }
    setLoading(false)
  }

  // Layer 3: Email OTP
  const handleEmailOtp = async () => {
    if (emailOtp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'verify_email_otp', email, token: emailOtp })
      })
      const data = await res.json()
      if (data.valid) {
        if (hasBiometric) {
          setLayer('biometric')
        } else {
          setLayer('done')
          onApproved()
        }
      } else {
        setError('Invalid OTP. Try again.')
      }
    } catch {
      setError('Verification failed.')
    }
    setLoading(false)
  }

  // Layer 4: Biometric
  const handleBiometric = async () => {
    setLoading(true)
    setError('')
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
          timeout: 60000,
        }
      } as CredentialRequestOptions)
      if (credential) {
        setLayer('done')
        onApproved()
      }
    } catch {
      setError('Biometric failed. Try again.')
    }
    setLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    wrap: { background: '#070d14', border: '1px solid rgba(0,179,247,0.3)', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%', fontFamily: 'monospace', color: '#e8f4fd' },
    title: { color: '#00b3f7', fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700 },
    step: { fontSize: '0.62rem', color: 'rgba(232,244,253,0.3)', marginBottom: 16 },
    info: { background: '#0c1520', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.72rem' },
    row: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
    label: { color: 'rgba(232,244,253,0.4)' },
    val: { color: '#e8f4fd' },
    input: { width: '100%', padding: '12px', background: '#0c1520', border: '1px solid rgba(0,179,247,0.3)', borderRadius: 8, color: '#e8f4fd', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '0.3em', textAlign: 'center' as const, outline: 'none', marginBottom: 12 },
    btn: { width: '100%', padding: 13, background: '#00b3f7', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' },
    btnRed: { width: '100%', padding: 12, background: 'transparent', border: '1px solid rgba(255,68,102,0.4)', borderRadius: 8, color: '#ff4466', fontFamily: 'monospace', cursor: 'pointer', marginTop: 8, fontSize: '0.82rem' },
    error: { color: '#ff4466', fontSize: '0.72rem', textAlign: 'center' as const, marginTop: 8 },
    layers: { display: 'flex', gap: 4, marginBottom: 16 },
    layerDot: (active: boolean, done: boolean) => ({ flex: 1, height: 3, borderRadius: 2, background: done ? '#00ff88' : active ? '#00b3f7' : 'rgba(255,255,255,0.1)' }),
  }

  const layerIndex = { totp: 0, phone: 1, email_otp: 2, biometric: 3, done: 4 }
  const currentIndex = layerIndex[layer]

  return (
    <div style={s.wrap}>
      {/* Progress bar */}
      <div style={s.layers}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={s.layerDot(i === currentIndex, i < currentIndex)} />
        ))}
      </div>

      {/* TX Info */}
      <div style={s.info}>
        {amount && <div style={s.row}><span style={s.label}>Amount</span><span style={s.val}>{amount}</span></div>}
        {to && <div style={s.row}><span style={s.label}>To</span><span style={s.val}>{to.slice(0, 8)}...{to.slice(-6)}</span></div>}
        <div style={s.row}><span style={s.label}>TX ID</span><span style={s.val}>{txId.slice(0, 10)}...</span></div>
      </div>

      {/* LAYER 1: Google Authenticator */}
      {layer === 'totp' && (
        <>
          <div style={s.title}>🔢 LAYER 1 · GOOGLE AUTHENTICATOR</div>
          <div style={s.step}>Enter your 6-digit authenticator code</div>
          <input style={s.input} type="text" maxLength={6} value={totp}
            onChange={e => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleTotp()}
            placeholder="000000" autoFocus />
          <button style={s.btn} onClick={handleTotp} disabled={loading || totp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify →'}
          </button>
          <button style={s.btnRed} onClick={onRejected}>Cancel</button>
          {error && <div style={s.error}>{error}</div>}
        </>
      )}

      {/* LAYER 2: Phone Approval */}
      {layer === 'phone' && (
        <>
          <div style={s.title}>📱 LAYER 2 · PHONE APPROVAL</div>
          <div style={s.step}>Check your device for approval notification</div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {phoneStatus === 'waiting' && (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📱</div>
                <div style={{ color: 'rgba(232,244,253,0.5)', fontSize: '0.78rem', marginBottom: 8 }}>
                  Waiting for approval...
                </div>
                <div style={{ color: 'rgba(232,244,253,0.3)', fontSize: '0.68rem' }}>
                  Open TheWall on your phone and tap Approve
                </div>
                <div style={{ marginTop: 16 }}>
                  <a href={`/approve?txId=${txId}`} target="_blank" rel="noreferrer"
                    style={{ color: '#00b3f7', fontSize: '0.75rem' }}>
                    👆 Tap here to approve on this device
                  </a>
                </div>
              </>
            )}
            {phoneStatus === 'approved' && (
              <div style={{ color: '#00ff88', fontSize: '1rem', fontWeight: 700 }}>✅ Phone Approved!</div>
            )}
          </div>
          <button style={s.btnRed} onClick={onRejected}>Cancel</button>
        </>
      )}

      {/* LAYER 3: Email OTP */}
      {layer === 'email_otp' && (
        <>
          <div style={s.title}>📧 LAYER 3 · EMAIL OTP</div>
          <div style={s.step}>OTP sent to {email}</div>
          {!otpSent && (
            <button style={{ ...s.btn, marginBottom: 12 }} onClick={sendEmailOtp}>
              Send OTP to Email
            </button>
          )}
          {otpSent && (
            <>
              <div style={{ color: '#00ff88', fontSize: '0.72rem', marginBottom: 12, textAlign: 'center' }}>
                ✅ OTP sent to {email}
              </div>
              <input style={s.input} type="text" maxLength={6} value={emailOtp}
                onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleEmailOtp()}
                placeholder="000000" autoFocus />
              <button style={s.btn} onClick={handleEmailOtp} disabled={loading || emailOtp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
            </>
          )}
          <button style={s.btnRed} onClick={onRejected}>Cancel</button>
          {error && <div style={s.error}>{error}</div>}
        </>
      )}

      {/* LAYER 4: Biometric (if available) */}
      {layer === 'biometric' && (
        <>
          <div style={s.title}>👆 LAYER 4 · BIOMETRIC</div>
          <div style={s.step}>Face ID or Fingerprint required</div>
          <div style={{ textAlign: 'center', fontSize: '3rem', margin: '16px 0' }}>👆</div>
          <button style={s.btn} onClick={handleBiometric} disabled={loading}>
            {loading ? 'Verifying...' : '👆 Authenticate'}
          </button>
          <button style={s.btnRed} onClick={onRejected}>Cancel</button>
          {error && <div style={s.error}>{error}</div>}
        </>
      )}

      {/* Done */}
      {layer === 'done' && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
          <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '1rem' }}>
            Transaction Approved!
          </div>
          <div style={{ color: 'rgba(232,244,253,0.4)', fontSize: '0.72rem', marginTop: 8 }}>
            All security layers passed
          </div>
        </div>
      )}
    </div>
  )
}

