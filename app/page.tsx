'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'

interface TokenPrice { price: number; change24h: number }
interface Prices { [symbol: string]: TokenPrice }
interface WalletData {
  address: string
  ethBalance: number
  solBalance?: number
  tokenBalances: Array<{ contractAddress: string; tokenBalance: string }>
}
interface UserWallet {
  address: string
  type: 'smart' | 'external'
  email?: string
  twoFaMethod?: 'biometric' | 'totp'
}
interface SearchResult {
  address: string
  ethBalance: number
  ethUsd: number
  solBalance: number
  solUsd: number
  tokenCount: number
  nftCount: number
  txCount: number
  loading: boolean
  error: string
}

const MAIN_WALLET = '0xba24d47ef3f4e1000000000000000000f3f4e1'
const TREASURY = '0xecbdebb62d636808a3e94183070585814127393d'
const SOL_WALLET = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'
const GOAL_USD = 6_200_000
const EMOCOIN = { balance: 250, priceUsd: 0.01 }

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', color: '#627eea', chain: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana', color: '#9945ff', chain: 'Solana' },
  { symbol: 'BNB', name: 'BNB', color: '#f0b90b', chain: 'BSC' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775ca', chain: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether', color: '#26a17b', chain: 'Ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', color: '#f7931a', chain: 'Bitcoin' },
]

export default function TheWall() {
  const [screen, setScreen] = useState<'login' | 'dashboard'>('login')
  const [loginStep, setLoginStep] = useState<'home' | 'email' | 'choose2fa' | 'biometric' | 'totp' | 'creating'>('home')
  const [email, setEmail] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserWallet | null>(null)
  const [prices, setPrices] = useState<Prices>({})
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [activeTab, setActiveTab] = useState('portfolio')
  const [refreshing, setRefreshing] = useState(false)
  const [priceError, setPriceError] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)

  // Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Send state
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTab, setSendTab] = useState<'send'|'receive'>('send')
  const [sendChain, setSendChain] = useState<'ETH'|'SOL'>('ETH')
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const [addressBook, setAddressBook] = useState<{name:string,address:string}[]>([])

  useEffect(() => {
    const check = async () => {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setHasBiometric(available)
      } catch { setHasBiometric(false) }
    }
    check()
  }, [])

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()
      if (data.prices && Object.keys(data.prices).length > 0) {
        setPrices(data.prices)
        setPriceError(false)
      }
    } catch { setPriceError(true) }
  }, [])

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const [ethRes, solRes] = await Promise.all([
        fetch('/api/balance?address=' + address),
        fetch('/api/solana'),
      ])
      const ethData = await ethRes.json()
      const solData = await solRes.json()
      setWalletData({ ...ethData, solBalance: solData.solBalance || 0 })
    } catch (e) { console.error('Balance fetch failed:', e) }
  }, [])

  const searchWallet = async (addr: string) => {
    const address = addr.trim()
    if (!address || address.length < 10) return
    setSearchResult({ address, ethBalance:0, ethUsd:0, solBalance:0, solUsd:0, tokenCount:0, nftCount:0, txCount:0, loading:true, error:'' })
    setSearchHistory(prev => [address, ...prev.filter(a => a !== address)].slice(0, 5))
    try {
      const ethPrice = prices.ETH?.price || 0
      let ethBalance = 0
      let txCount = 0
      if (address.startsWith('0x')) {
        try {
          const rpcRes = await fetch('https://eth.llamarpc.com', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_getBalance', params:[address,'latest'] })
          })
          const rpcData = await rpcRes.json()
          if (rpcData.result) ethBalance = parseInt(rpcData.result, 16) / 1e18
          const txRes = await fetch('https://eth.llamarpc.com', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc:'2.0', id:2, method:'eth_getTransactionCount', params:[address,'latest'] })
          })
          const txData = await txRes.json()
          if (txData.result) txCount = parseInt(txData.result, 16)
        } catch { /* RPC failed */ }
      }
      setSearchResult({ address, ethBalance, ethUsd: ethBalance * ethPrice, solBalance:0, solUsd:0, tokenCount:0, nftCount:0, txCount, loading:false, error:'' })
    } catch {
      setSearchResult(prev => prev ? { ...prev, loading:false, error:'Failed to fetch wallet data' } : null)
    }
  }

  const handleSend = async () => {
    if (!sendTo || !sendAmount) return
    setSendLoading(true)
    setSendError('')
    setSendSuccess('')
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain: sendChain, to: sendTo, amount: sendAmount, from: user?.address || MAIN_WALLET })
      })
      const data = await res.json()
      if (data.success) {
        setSendSuccess(`Transaction prepared! ${sendAmount} ${sendChain} → ${sendTo.slice(0,8)}...`)
        setSendAmount('')
        setSendTo('')
      } else {
        setSendError(data.error || 'Send failed')
      }
    } catch {
      setSendError('Network error. Try again.')
    }
    setSendLoading(false)
  }

  const handleQRScan = () => {
    setSendError('QR scan: Use camera app to scan wallet QR, then paste address above.')
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  const handleEmailContinue = () => {
    if (!email.includes('@')) return
    setError('')
    setLoginStep('choose2fa')
  }

  const handleBiometricAuth = async () => {
    setError('')
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)
      const credential = await navigator.credentials.get({
        publicKey: { challenge, rpId: window.location.hostname, allowCredentials: [], userVerification:'required', timeout:60000 }
      } as CredentialRequestOptions)
      if (credential) {
        setLoginStep('creating')
        await new Promise(r => setTimeout(r, 1500))
        setUser({ address: MAIN_WALLET, type:'smart', email, twoFaMethod:'biometric' })
        await fetchBalance(MAIN_WALLET)
        setScreen('dashboard')
      }
    } catch {
      setError('Biometric failed. Try again or use Google Authenticator.')
    }
  }

  const handleTotpAuth = async () => {
    if (totpCode.length !== 6) return
    setError('')
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type:'totp', token:totpCode })
      })
      const data = await res.json()
      if (data.valid) {
        setLoginStep('creating')
        await new Promise(r => setTimeout(r, 1500))
        setUser({ address: MAIN_WALLET, type:'smart', email, twoFaMethod:'totp' })
        await fetchBalance(MAIN_WALLET)
        setScreen('dashboard')
      } else { setError('Invalid code. Try again.') }
    } catch { setError('Verification failed.') }
  }

  const handleGuestView = () => {
    setUser({ address: MAIN_WALLET, type:'external' })
    fetchBalance(MAIN_WALLET)
    setScreen('dashboard')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPrices(), fetchBalance(user?.address || MAIN_WALLET)])
    setRefreshing(false)
  }

  const portfolioTotal = (() => {
    const eth = (walletData?.ethBalance || 0) * (prices.ETH?.price || 0)
    const sol = (walletData?.solBalance || 0) * (prices.SOL?.price || 0)
    const emc = EMOCOIN.balance * EMOCOIN.priceUsd
    return eth + sol + emc
  })()

  const goalPct = Math.min((portfolioTotal / GOAL_USD) * 100, 100)
  const fmt = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : '$' + n.toFixed(2)
  const fmtAddr = (a: string) => a.slice(0, 8) + '...' + a.slice(-6)
  const walletLabel = user?.type === 'smart' ? ('SMART WALLET ' + (user.twoFaMethod === 'biometric' ? '👆' : '🔢')) : 'MAIN WALLET'
  const goalWidth = Math.max(goalPct, 0.1) + '%'

  if (screen === 'login') {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.logo + ' fade-up'}>
            <span className={styles.hexLogo}>⬡</span>
            <div>
              <div className={styles.logoTitle}>THE WALL</div>
              <div className={styles.logoSub}>Web3 Portfolio · Kannur → Dubai</div>
            </div>
          </div>
          {loginStep === 'home' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>Gasless smart wallet. No seed phrase.<br />Powered by Alchemy Account Kit.</p>
              <div className={styles.featureRow}>
                {[['⬡','No Seed Phrase'],['⚡','Gasless Txns'],['🔒','2FA Secured']].map(([icon,label]) => (
                  <div key={label} className={styles.featureChip}><span>{icon}</span><span>{label}</span></div>
                ))}
              </div>
              <button className={styles.btnPrimary} onClick={() => setLoginStep('email')}>Sign Up / Login</button>
              <button className={styles.btnSecondary} onClick={handleGuestView}>View Portfolio (Guest)</button>
              <div className={styles.gasNote}>✅ Gas fees sponsored by Emobies-Sponsorship-v1 · 54+ networks</div>
            </div>
          )}
          {loginStep === 'email' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>Enter your email to continue.</p>
              <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailContinue()} autoFocus />
              {error && <p style={{ color:'#ff4466', fontSize:'0.72rem', marginBottom:8 }}>{error}</p>}
              <button className={styles.btnPrimary} onClick={handleEmailContinue}>Continue →</button>
              <button className={styles.btnGhost} onClick={() => setLoginStep('home')}>← Back</button>
            </div>
          )}
          {loginStep === 'choose2fa' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}><strong style={{ color:'#00b3f7' }}>Choose your 2FA method</strong><br />This will be used every time you login</p>
              {hasBiometric && <button className={styles.btnPrimary} onClick={() => { setLoginStep('biometric'); handleBiometricAuth() }}>👆 Fingerprint / Face ID</button>}
              <button className={hasBiometric ? styles.btnSecondary : styles.btnPrimary} onClick={() => setLoginStep('totp')}>🔢 Google Authenticator</button>
              {!hasBiometric && <div style={{ fontSize:'0.68rem', color:'rgba(232,244,253,0.3)', textAlign:'center', marginTop:8 }}>Biometric not available on this device</div>}
              <button className={styles.btnGhost} onClick={() => setLoginStep('email')}>← Back</button>
            </div>
          )}
          {loginStep === 'biometric' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>👆 <strong>Biometric Verification</strong><br />Use Face ID or Fingerprint</p>
              <div style={{ textAlign:'center', fontSize:'3rem', margin:'20px 0' }}>👆</div>
              <button className={styles.btnPrimary} onClick={handleBiometricAuth}>👆 Authenticate</button>
              {error && <p style={{ color:'#ff4466', fontSize:'0.72rem', textAlign:'center', marginTop:8 }}>{error}</p>}
              <button className={styles.btnGhost} onClick={() => setLoginStep('choose2fa')}>← Back</button>
            </div>
          )}
          {loginStep === 'totp' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>🔢 <strong>Google Authenticator</strong><br />Enter your 6-digit code</p>
              <input className={styles.input} type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g,'').slice(0,6))} onKeyDown={e => e.key === 'Enter' && handleTotpAuth()} autoFocus />
              {error && <p style={{ color:'#ff4466', fontSize:'0.72rem', marginBottom:8 }}>{error}</p>}
              <button className={styles.btnPrimary} onClick={handleTotpAuth} disabled={totpCode.length !== 6}>Verify →</button>
              <button className={styles.btnGhost} onClick={() => setLoginStep('choose2fa')}>← Back</button>
            </div>
          )}
          {loginStep === 'creating' && (
            <div className={styles.creating + ' fade-up-1'}>
              <div className={styles.spinner} />
              <p>Setting up your wallet...</p>
              <p className={styles.creatingNote}>No gas fees. No seed phrase.</p>
            </div>
          )}
        </div>
        <div className={styles.loginFooter}>⬡ THE WALL · DWIN · 2026 · KANNUR → DUBAI</div>
      </div>
    )
  }

  return (
    <div className={styles.dashWrap}>
      <header className={styles.header + ' fade-up'}>
        <div className={styles.headerLeft}>
          <span className={styles.hexSmall}>⬡</span>
          <span className={styles.headerTitle}>THE WALL</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.searchIconBtn} onClick={() => setSearchOpen(true)} title="Search wallet">🔍</button>
          <button className={styles.searchIconBtn} onClick={() => { setSendOpen(true); setSendTab('send') }} title="Send crypto">📤</button>
          <button className={styles.searchIconBtn} onClick={() => { setSendOpen(true); setSendTab('receive') }} title="Receive crypto">📥</button>
          <span className={styles.chainBadge}>ETH</span>
          <span className={styles.chainBadge}>SOL</span>
          <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <span style={{ display:'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
          </button>
          <button className={styles.logoutBtn} onClick={() => { setScreen('login'); setLoginStep('home') }}>⏻</button>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className={styles.searchOverlay} onClick={() => setSearchOpen(false)}>
          <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <span className={styles.searchTitle}>🔍 Wallet Search</span>
              <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchResult(null); setSearchQuery('') }}>✕</button>
            </div>
            <div className={styles.searchInputRow}>
              <input className={styles.searchInput} placeholder="Enter ETH/SOL wallet address..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchWallet(searchQuery)} autoFocus />
              <button className={styles.searchBtn} onClick={() => searchWallet(searchQuery)}>→</button>
            </div>
            {!searchResult && searchHistory.length > 0 && (
              <div className={styles.searchHistory}>
                <div className={styles.searchHistoryLabel}>Recent searches</div>
                {searchHistory.map(addr => (
                  <div key={addr} className={styles.searchHistoryItem} onClick={() => { setSearchQuery(addr); searchWallet(addr) }}>
                    <span className={styles.historyIcon}>⬡</span>
                    <span className={styles.historyAddr}>{addr.slice(0,10)}...{addr.slice(-8)}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResult && (
              <div className={styles.searchResult}>
                {searchResult.loading ? (
                  <div className={styles.searchLoading}><div className={styles.spinner} /><span>Fetching wallet data...</span></div>
                ) : searchResult.error ? (
                  <div className={styles.searchError}>⚠ {searchResult.error}</div>
                ) : (
                  <>
                    <div className={styles.searchAddr}>
                      {searchResult.address.slice(0,10)}...{searchResult.address.slice(-8)}
                      <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(searchResult.address)}>📋</button>
                    </div>
                    <div className={styles.searchCards}>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>ETH Balance</div>
                        <div className={styles.searchCardValue} style={{ color:'#627eea' }}>{searchResult.ethBalance.toFixed(4)} ETH</div>
                        <div className={styles.searchCardUsd}>${searchResult.ethUsd.toFixed(2)}</div>
                      </div>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>SOL Balance</div>
                        <div className={styles.searchCardValue} style={{ color:'#9945ff' }}>{searchResult.solBalance.toFixed(4)} SOL</div>
                        <div className={styles.searchCardUsd}>${searchResult.solUsd.toFixed(2)}</div>
                      </div>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>Transactions</div>
                        <div className={styles.searchCardValue}>{searchResult.txCount}</div>
                        <div className={styles.searchCardUsd}>total txns</div>
                      </div>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>Total Value</div>
                        <div className={styles.searchCardValue} style={{ color:'#00e5ff' }}>${(searchResult.ethUsd + searchResult.solUsd).toFixed(2)}</div>
                        <div className={styles.searchCardUsd}>USD</div>
                      </div>
                    </div>
                    <button className={styles.searchViewBtn} onClick={() => { setUser({ address: searchResult.address, type:'external' }); fetchBalance(searchResult.address); setSearchOpen(false); setSearchResult(null) }}>
                      View Full Portfolio →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send/Receive Modal */}
      {sendOpen && (
        <div className={styles.searchOverlay} onClick={() => setSendOpen(false)}>
          <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <span className={styles.searchTitle}>{sendTab === 'send' ? '📤 Send Crypto' : '📥 Receive'}</span>
              <button className={styles.searchClose} onClick={() => { setSendOpen(false); setSendError(''); setSendSuccess('') }}>✕</button>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {(['send','receive'] as const).map(t => (
                <button key={t} onClick={() => setSendTab(t)} style={{ flex:1, padding:'10px', border:'1px solid', borderColor: sendTab === t ? 'var(--cyan)' : 'var(--border)', borderRadius:8, background: sendTab === t ? 'var(--cyan-glow)' : 'transparent', color: sendTab === t ? 'var(--cyan)' : 'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.8rem', cursor:'pointer' }}>
                  {t === 'send' ? '📤 Send' : '📥 Receive'}
                </button>
              ))}
            </div>

            {sendTab === 'send' && (
              <div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>SELECT CHAIN</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {(['ETH','SOL'] as const).map(c => (
                      <button key={c} onClick={() => setSendChain(c)} style={{ flex:1, padding:'10px', border:'1px solid', borderColor: sendChain === c ? (c === 'ETH' ? '#627eea' : '#9945ff') : 'var(--border)', borderRadius:8, background:'var(--bg3)', color: sendChain === c ? (c === 'ETH' ? '#627eea' : '#9945ff') : 'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
                        {c === 'ETH' ? '⬡ ETH' : '◎ SOL'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>TO ADDRESS</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input className={styles.searchInput} placeholder={sendChain === 'ETH' ? '0x...' : 'SOL address...'} value={sendTo} onChange={e => setSendTo(e.target.value)} style={{ flex:1 }} />
                    <button onClick={handleQRScan} style={{ padding:'0 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--cyan)', fontSize:'1.1rem', cursor:'pointer' }}>📷</button>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>AMOUNT</div>
                  <div style={{ position:'relative' }}>
                    <input className={styles.searchInput} placeholder="0.00" type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} style={{ width:'100%', paddingRight:60 }} />
                    <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:'0.75rem', color: sendChain === 'ETH' ? '#627eea' : '#9945ff', fontWeight:700 }}>{sendChain}</span>
                  </div>
                  {sendAmount && prices[sendChain] && (
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:4 }}>≈ ${(parseFloat(sendAmount || '0') * (prices[sendChain]?.price || 0)).toFixed(2)} USD</div>
                  )}
                </div>
                {addressBook.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>ADDRESS BOOK</div>
                    {addressBook.map((entry, i) => (
                      <div key={i} onClick={() => setSendTo(entry.address)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, marginBottom:6, cursor:'pointer' }}>
                        <span style={{ fontSize:'0.8rem' }}>👤</span>
                        <div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text)' }}>{entry.name}</div>
                          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{entry.address.slice(0,10)}...{entry.address.slice(-6)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { const name = prompt('Contact name:'); if (name && sendTo) setAddressBook(prev => [...prev, { name, address: sendTo }]) }} style={{ background:'none', border:'1px dashed var(--border)', borderRadius:8, color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.72rem', padding:'8px 14px', cursor:'pointer', width:'100%', marginBottom:12 }}>
                  + Save to Address Book
                </button>
                {sendError && <div style={{ padding:'10px', background:'rgba(255,68,102,0.08)', border:'1px solid rgba(255,68,102,0.2)', borderRadius:8, color:'var(--red)', fontSize:'0.75rem', marginBottom:12 }}>⚠ {sendError}</div>}
                {sendSuccess && <div style={{ padding:'10px', background:'rgba(0,255,136,0.05)', border:'1px solid rgba(0,255,136,0.2)', borderRadius:8, color:'var(--green)', fontSize:'0.75rem', marginBottom:12 }}>✅ {sendSuccess}</div>}
                <button className={styles.searchBtn} style={{ width:'100%', padding:'13px' }} onClick={handleSend} disabled={sendLoading || !sendTo || !sendAmount}>
                  {sendLoading ? '⏳ Processing...' : `📤 Send ${sendChain}`}
                </button>
              </div>
            )}

            {sendTab === 'receive' && (
              <div style={{ textAlign:'center' }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:8, letterSpacing:'0.08em' }}>YOUR ETH WALLET</div>
                  <div style={{ padding:'14px', background:'var(--bg2)', border:'1px solid var(--border-bright)', borderRadius:10, fontSize:'0.72rem', color:'var(--cyan)', wordBreak:'break-all', fontFamily:'var(--font-mono)', lineHeight:1.6 }}>
                    {user?.address || MAIN_WALLET}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(user?.address || MAIN_WALLET)} style={{ marginTop:10, padding:'10px 20px', background:'var(--bg3)', border:'1px solid var(--border-bright)', borderRadius:8, color:'var(--cyan)', fontFamily:'var(--font-mono)', fontSize:'0.8rem', cursor:'pointer' }}>
                    📋 Copy ETH Address
                  </button>
                </div>
                <div style={{ padding:'14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, marginBottom:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:8 }}>SOLANA WALLET</div>
                  <div style={{ fontSize:'0.68rem', color:'#9945ff', wordBreak:'break-all', fontFamily:'var(--font-mono)', lineHeight:1.6 }}>{SOL_WALLET}</div>
                  <button onClick={() => navigator.clipboard.writeText(SOL_WALLET)} style={{ marginTop:8, padding:'8px 16px', background:'rgba(153,69,255,0.1)', border:'1px solid rgba(153,69,255,0.3)', borderRadius:6, color:'#9945ff', fontFamily:'var(--font-mono)', fontSize:'0.72rem', cursor:'pointer' }}>
                    📋 Copy SOL Address
                  </button>
                </div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', lineHeight:1.6 }}>⚠️ Only send ETH/ERC-20 to ETH address<br/>Only send SOL/SPL to Solana address</div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className={styles.main}>
        <section className={styles.walletCard + ' fade-up-1'}>
          <div className={styles.walletTop}>
            <div>
              <div className={styles.walletLabel}>{walletLabel}</div>
              <div className={styles.walletAddr}>
                {fmtAddr(user?.address || MAIN_WALLET)}
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(user?.address || MAIN_WALLET)}>📋</button>
              </div>
              {user?.email && <div className={styles.walletEmail}>{user.email}</div>}
            </div>
            <div className={styles.walletTotal}>
              <div className={styles.totalLabel}>TOTAL PORTFOLIO</div>
              <div className={styles.totalAmount}>{portfolioTotal > 0 ? fmt(portfolioTotal) : <span className={styles.loading}>$···</span>}</div>
            </div>
          </div>
          <div className={styles.goalSection}>
            <div className={styles.goalRow}>
              <span className={styles.goalLabel}>GOAL: $6,200,000 (₹52 Crore)</span>
              <span className={styles.goalPct}>{goalPct.toFixed(4)}%</span>
            </div>
            <div className={styles.goalBar}><div className={styles.goalFill} style={{ width: goalWidth }} /></div>
          </div>
        </section>

        <section className={styles.emoSection + ' fade-up-2'}>
          <div className={styles.emoCard}>
            <span className={styles.emoIcon}>🪙</span>
            <div><div className={styles.emoTitle}>EMOCOINS</div><div className={styles.emoBalance}>{EMOCOIN.balance} EMC</div></div>
            <div className={styles.emoRight}>
              <div className={styles.emoPrice}>1 EMC = ${EMOCOIN.priceUsd}</div>
              <button className={styles.claimBtn}>+ Daily Claim</button>
            </div>
          </div>
        </section>

        <div className={styles.tabs + ' fade-up-3'}>
          {['portfolio','prices','history','treasury'].map(tab => (
            <button key={tab} className={styles.tab + (activeTab === tab ? ' ' + styles.tabActive : '')} onClick={() => setActiveTab(tab)}>
              {tab === 'portfolio' && '💼'}{tab === 'prices' && '📊'}{tab === 'history' && '📋'}{tab === 'treasury' && '🏛️'} {tab}
            </button>
          ))}
        </div>

        <div className={styles.tabContent + ' fade-up-4'}>
          {activeTab === 'portfolio' && (
            <div className={styles.tokenGrid}>
              {TOKENS.map(token => {
                const p = prices[token.symbol]
                const bal = token.symbol === 'ETH' ? walletData?.ethBalance || 0 : token.symbol === 'SOL' ? walletData?.solBalance || 0 : 0
                const priceStr = p ? '$' + p.price.toLocaleString('en', { minimumFractionDigits:2, maximumFractionDigits:2 }) : null
                return (
                  <div key={token.symbol} className={styles.tokenCard}>
                    <div className={styles.tokenLeft}>
                      <div className={styles.tokenDot} style={{ background: token.color }} />
                      <div>
                        <div className={styles.tokenSymbol}>{token.symbol}</div>
                        <div className={styles.tokenName}>{token.name}</div>
                        <div className={styles.tokenChain}>{token.chain}</div>
                      </div>
                    </div>
                    <div className={styles.tokenRight}>
                      <div className={styles.tokenPrice}>{priceStr ? priceStr : <span className={styles.loading}>$···</span>}</div>
                      {p && <div className={styles.tokenChange + ' ' + (p.change24h >= 0 ? styles.green : styles.red)}>{p.change24h >= 0 ? '▲' : '▼'} {Math.abs(p.change24h).toFixed(2)}%</div>}
                      {bal > 0 && <div className={styles.tokenBal}>{bal.toFixed(4)} {token.symbol}</div>}
                      <div className={styles.tokenLive}><span className={styles.liveDot} />Live</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {activeTab === 'prices' && (
            <div>
              {priceError && <div className={styles.errorBanner}>⚠ Price feed unavailable.</div>}
              <div className={styles.priceTable}>
                <div className={styles.priceHeader}><span>Asset</span><span>Price (USD)</span><span>24h Change</span></div>
                {TOKENS.map(token => {
                  const p = prices[token.symbol]
                  return (
                    <div key={token.symbol} className={styles.priceRow}>
                      <span><span className={styles.tokenDotSmall} style={{ background: token.color }} />{token.symbol}</span>
                      <span className={styles.priceVal}>{p ? '$' + p.price.toLocaleString('en', { minimumFractionDigits:2 }) : '···'}</span>
                      <span className={p && p.change24h >= 0 ? styles.green : styles.red}>{p ? (p.change24h >= 0 ? '+' : '') + p.change24h.toFixed(2) + '%' : '···'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <div className={styles.historySection}>
              <div className={styles.historyItem}>
                <div className={styles.historyLeft}>
                  <span className={styles.historyIcon}>⬡</span>
                  <div><div className={styles.historyTitle}>First SOL Transaction</div><div className={styles.historyDate}>Sep 19, 2024 · Solana Mainnet</div></div>
                </div>
                <div className={styles.historyRight}>
                  <div className={styles.historySig}>5GRcJv...amLt</div>
                  <div className={styles.historyFee}>Fee: 0.000015 SOL</div>
                </div>
              </div>
              <div className={styles.historyNote}>Connect Alchemy API key to load full transaction history</div>
            </div>
          )}
          {activeTab === 'treasury' && (
            <div className={styles.treasurySection}>
              <div className={styles.treasuryCard}>
                <div className={styles.treasuryIcon}>🏛️</div>
                <div><div className={styles.treasuryLabel}>TREASURY WALLET</div><div className={styles.treasuryAddr}>{TREASURY}</div></div>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(TREASURY)}>📋</button>
              </div>
              <div className={styles.treasuryCard}>
                <div className={styles.treasuryIcon}>◎</div>
                <div><div className={styles.treasuryLabel}>SOLANA WALLET</div><div className={styles.treasuryAddr}>{SOL_WALLET}</div></div>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(SOL_WALLET)}>📋</button>
              </div>
              <div className={styles.webhookStatus}><span className={styles.liveDot} />Alchemy Webhook Active · Solana Mainnet · Address Activity</div>
            </div>
          )}
        </div>
      </main>
      <footer className={styles.footer}>⬡ THE WALL · KANNUR → DUBAI · DWIN · 2026</footer>
    </div>
  )
}
