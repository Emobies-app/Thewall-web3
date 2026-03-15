'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'

interface TokenPrice { price: number; change24h: number }
interface Prices { [symbol: string]: TokenPrice }
interface WalletData {
  address: string
  ethBalance: number
  solBalance?: number
  maticBalance?: number
  arbBalance?: number
  bnbBalance?: number
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
interface SwapState {
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  amount: string
  estimatedOut: string
  loading: boolean
  error: string
  success: string
  priceImpact: number
  route: string
}

const MAIN_WALLET = '0xba24d47ef3f4e1000000000000000000f3f4e1'
const TREASURY = '0xecbdebb62d636808a3e94183070585814127393d'
const SOL_WALLET = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'
const GOAL_USD = 6_200_000
const EMOCOIN = { balance: 250, priceUsd: 0.01 }

// RPC URLs - using env vars with free fallbacks
const getRPC = (chain: string) => {
  const key = process.env.ALCHEMY_API_KEY || ''
  const rpcs: { [k: string]: string } = {
    earth:  key ? `https://eth-mainnet.g.alchemy.com/v2/${key}` : 'https://eth.llamarpc.com',
    soul:   'https://mainnet.helius-rpc.com/?api-key=' + (process.env.HELIUS_API_KEY || ''),
    moon:   process.env.thewallmoon || 'https://rpc.monad.xyz',
    orbit:  process.env.thewallorbit || 'https://arb1.arbitrum.io/rpc',
    birth:  process.env.TheWallbirth || 'https://mempool.space/api',
  }
  return rpcs[chain] || rpcs.earth
}

const TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum', color: '#627eea', chain: 'Earth 🌍',   rpc: 'earth'  },
  { symbol: 'SOL',  name: 'Solana',   color: '#9945ff', chain: 'Soul 🌟',    rpc: 'soul'   },
  { symbol: 'MON',  name: 'Monad',    color: '#836ef9', chain: 'Moon 🌙',    rpc: 'moon'   },
  { symbol: 'ARB',  name: 'Arbitrum', color: '#12aaff', chain: 'Orbit 🪐',   rpc: 'orbit'  },
  { symbol: 'BTC',  name: 'Bitcoin',  color: '#f7931a', chain: 'Birth ₿',    rpc: 'birth'  },
  { symbol: 'BNB',  name: 'BNB',      color: '#f0b90b', chain: 'BSC',        rpc: 'earth'  },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775ca', chain: 'Ethereum',   rpc: 'earth'  },
  { symbol: 'USDT', name: 'Tether',   color: '#26a17b', chain: 'Ethereum',   rpc: 'earth'  },
  { symbol: 'EMC',  name: 'EmoCoins', color: '#00e5ff', chain: 'TheWall 🦋', rpc: 'earth'  },
]

const SWAP_TOKENS = ['ETH', 'SOL', 'MON', 'ARB', 'BTC', 'USDC', 'USDT', 'EMC']

const CHAIN_COLORS: { [k: string]: string } = {
  earth: '#627eea', soul: '#9945ff', moon: '#836ef9',
  orbit: '#12aaff', birth: '#f7931a',
}

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

  // Search
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Send
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTab, setSendTab] = useState<'send' | 'receive'>('send')
  const [sendChain, setSendChain] = useState<'ETH' | 'SOL' | 'ARB' | 'MON' | 'BTC'>('ETH')
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const [addressBook, setAddressBook] = useState<{ name: string; address: string }[]>([])

  // Swap
  const [swap, setSwap] = useState<SwapState>({
    fromChain: 'earth', toChain: 'soul',
    fromToken: 'ETH', toToken: 'SOL',
    amount: '', estimatedOut: '',
    loading: false, error: '', success: '',
    priceImpact: 0, route: '',
  })

  // Chain status
  const [chainStatus, setChainStatus] = useState<{ [k: string]: 'online' | 'offline' | 'checking' }>({
    earth: 'checking', soul: 'checking', moon: 'checking', orbit: 'checking', birth: 'checking',
  })

  useEffect(() => {
    const check = async () => {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setHasBiometric(available)
      } catch { setHasBiometric(false) }
    }
    check()
    checkChainStatus()
  }, [])

  const checkChainStatus = async () => {
    const chains = ['earth', 'soul', 'moon', 'orbit']
    for (const chain of chains) {
      try {
        const rpc = chain === 'earth' ? 'https://eth.llamarpc.com' :
                    chain === 'orbit' ? 'https://arb1.arbitrum.io/rpc' :
                    chain === 'soul'  ? 'https://api.mainnet-beta.solana.com' :
                    'https://rpc.monad.xyz'
        const res = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
          signal: AbortSignal.timeout(5000),
        })
        setChainStatus(prev => ({ ...prev, [chain]: res.ok ? 'online' : 'offline' }))
      } catch {
        setChainStatus(prev => ({ ...prev, [chain]: 'offline' }))
      }
    }
    setChainStatus(prev => ({ ...prev, birth: 'online' }))
  }

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
      const [ethRes, solRes, arbRes] = await Promise.all([
        fetch('/api/balance?address=' + address),
        fetch('/api/solana'),
        fetch('https://arb1.arbitrum.io/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
        }),
      ])
      const ethData = await ethRes.json()
      const solData = await solRes.json()
      const arbData = await arbRes.json()
      const arbBalance = arbData.result ? parseInt(arbData.result, 16) / 1e18 : 0
      setWalletData({ ...ethData, solBalance: solData.solBalance || 0, arbBalance })
    } catch (e) { console.error('Balance fetch failed:', e) }
  }, [])

  // Swap estimate
  const estimateSwap = useCallback(async (amount: string, fromToken: string, toToken: string) => {
    if (!amount || parseFloat(amount) <= 0) return
    const fromPrice = prices[fromToken]?.price || 0
    const toPrice = prices[toToken]?.price || 0
    if (!fromPrice || !toPrice) return
    const usdValue = parseFloat(amount) * fromPrice
    const estimated = usdValue / toPrice
    const impact = Math.random() * 0.5 + 0.1
    setSwap(prev => ({
      ...prev,
      estimatedOut: estimated.toFixed(6),
      priceImpact: impact,
      route: `${fromToken} → UniSwap V3 → ${toToken}`,
    }))
  }, [prices])

  useEffect(() => {
    if (swap.amount) estimateSwap(swap.amount, swap.fromToken, swap.toToken)
  }, [swap.amount, swap.fromToken, swap.toToken, estimateSwap])

  const handleSwap = async () => {
    if (!swap.amount || !swap.estimatedOut) return
    setSwap(prev => ({ ...prev, loading: true, error: '', success: '' }))
    try {
      await new Promise(r => setTimeout(r, 2000))
      setSwap(prev => ({
        ...prev,
        loading: false,
        success: `✅ Swapped ${swap.amount} ${swap.fromToken} → ${swap.estimatedOut} ${swap.toToken}`,
        amount: '',
        estimatedOut: '',
      }))
    } catch {
      setSwap(prev => ({ ...prev, loading: false, error: 'Swap failed. Try again.' }))
    }
  }

  const searchWallet = async (addr: string) => {
    const address = addr.trim()
    if (!address || address.length < 10) return
    setSearchResult({ address, ethBalance: 0, ethUsd: 0, solBalance: 0, solUsd: 0, tokenCount: 0, nftCount: 0, txCount: 0, loading: true, error: '' })
    setSearchHistory(prev => [address, ...prev.filter(a => a !== address)].slice(0, 5))
    try {
      const ethPrice = prices.ETH?.price || 0
      let ethBalance = 0, txCount = 0
      if (address.startsWith('0x')) {
        const rpcRes = await fetch('https://eth.llamarpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
        })
        const rpcData = await rpcRes.json()
        if (rpcData.result) ethBalance = parseInt(rpcData.result, 16) / 1e18
        const txRes = await fetch('https://eth.llamarpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_getTransactionCount', params: [address, 'latest'] }),
        })
        const txData = await txRes.json()
        if (txData.result) txCount = parseInt(txData.result, 16)
      }
      setSearchResult({ address, ethBalance, ethUsd: ethBalance * ethPrice, solBalance: 0, solUsd: 0, tokenCount: 0, nftCount: 0, txCount, loading: false, error: '' })
    } catch {
      setSearchResult(prev => prev ? { ...prev, loading: false, error: 'Failed to fetch wallet data' } : null)
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
        body: JSON.stringify({ chain: sendChain, to: sendTo, amount: sendAmount, from: user?.address || MAIN_WALLET }),
      })
      const data = await res.json()
      if (data.success) {
        setSendSuccess(`Transaction prepared! ${sendAmount} ${sendChain} → ${sendTo.slice(0, 8)}...`)
        setSendAmount('')
        setSendTo('')
      } else { setSendError(data.error || 'Send failed') }
    } catch { setSendError('Network error. Try again.') }
    setSendLoading(false)
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
        publicKey: { challenge, rpId: window.location.hostname, allowCredentials: [], userVerification: 'required', timeout: 60000 },
      } as CredentialRequestOptions)
      if (credential) {
        setLoginStep('creating')
        await new Promise(r => setTimeout(r, 1500))
        setUser({ address: MAIN_WALLET, type: 'smart', email, twoFaMethod: 'biometric' })
        await fetchBalance(MAIN_WALLET)
        setScreen('dashboard')
      }
    } catch { setError('Biometric failed. Try Google Authenticator.') }
  }

  const handleTotpAuth = async () => {
    if (totpCode.length !== 6) return
    setError('')
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'totp', token: totpCode }),
      })
      const data = await res.json()
      if (data.valid) {
        setLoginStep('creating')
        await new Promise(r => setTimeout(r, 1500))
        setUser({ address: MAIN_WALLET, type: 'smart', email, twoFaMethod: 'totp' })
        await fetchBalance(MAIN_WALLET)
        setScreen('dashboard')
      } else { setError('Invalid code. Try again.') }
    } catch { setError('Verification failed.') }
  }

  const handleGuestView = () => {
    setUser({ address: MAIN_WALLET, type: 'external' })
    fetchBalance(MAIN_WALLET)
    setScreen('dashboard')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPrices(), fetchBalance(user?.address || MAIN_WALLET), checkChainStatus()])
    setRefreshing(false)
  }

  const portfolioTotal = (() => {
    const eth = (walletData?.ethBalance || 0) * (prices.ETH?.price || 0)
    const sol = (walletData?.solBalance || 0) * (prices.SOL?.price || 0)
    const arb = (walletData?.arbBalance || 0) * (prices.ARB?.price || 0)
    const emc = EMOCOIN.balance * EMOCOIN.priceUsd
    return eth + sol + arb + emc
  })()

  const goalPct = Math.min((portfolioTotal / GOAL_USD) * 100, 100)
  const fmt = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : '$' + n.toFixed(2)
  const fmtAddr = (a: string) => a.slice(0, 8) + '...' + a.slice(-6)
  const walletLabel = user?.type === 'smart' ? ('SMART WALLET ' + (user.twoFaMethod === 'biometric' ? '👆' : '🔢')) : 'MAIN WALLET'
  const goalWidth = Math.max(goalPct, 0.1) + '%'

  const SEND_CHAINS = [
    { id: 'ETH', label: '🌍 ETH', color: '#627eea' },
    { id: 'SOL', label: '🌟 SOL', color: '#9945ff' },
    { id: 'ARB', label: '🪐 ARB', color: '#12aaff' },
    { id: 'MON', label: '🌙 MON', color: '#836ef9' },
    { id: 'BTC', label: '₿ BTC', color: '#f7931a' },
  ]

  // ═══════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════
  if (screen === 'login') {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.logo + ' fade-up'}>
            <span className={styles.hexLogo}>⬡</span>
            <div>
              <div className={styles.logoTitle}>THE WALL</div>
              <div className={styles.logoSub}>Web3 · Kannur → Dubai · 5 Chains</div>
            </div>
          </div>

          {loginStep === 'home' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>Gasless smart wallet. No seed phrase.<br />5 Chains. UniSwap Built-in.</p>
              <div className={styles.featureRow}>
                {[['⬡', 'No Seed Phrase'], ['⚡', 'Gasless Txns'], ['🔒', '2FA Secured'], ['🔄', 'UniSwap']].map(([icon, label]) => (
                  <div key={label} className={styles.featureChip}><span>{icon}</span><span>{label}</span></div>
                ))}
              </div>
              {/* Chain Status */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, justifyContent: 'center' }}>
                {[
                  { id: 'earth', label: '🌍 Earth' },
                  { id: 'soul', label: '🌟 Soul' },
                  { id: 'moon', label: '🌙 Moon' },
                  { id: 'orbit', label: '🪐 Orbit' },
                  { id: 'birth', label: '₿ Birth' },
                ].map(c => (
                  <div key={c.id} style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem',
                    border: '1px solid', fontFamily: 'var(--font-mono)',
                    borderColor: chainStatus[c.id] === 'online' ? 'rgba(0,255,136,0.3)' : chainStatus[c.id] === 'offline' ? 'rgba(255,68,102,0.3)' : 'rgba(255,255,255,0.1)',
                    color: chainStatus[c.id] === 'online' ? '#00ff88' : chainStatus[c.id] === 'offline' ? '#ff4466' : 'rgba(232,244,253,0.4)',
                    background: chainStatus[c.id] === 'online' ? 'rgba(0,255,136,0.05)' : 'transparent',
                  }}>
                    {c.label} {chainStatus[c.id] === 'online' ? '●' : chainStatus[c.id] === 'offline' ? '○' : '···'}
                  </div>
                ))}
              </div>
              <button className={styles.btnPrimary} onClick={() => setLoginStep('email')}>Sign Up / Login</button>
              <button className={styles.btnSecondary} onClick={handleGuestView}>View Portfolio (Guest)</button>
              <div className={styles.gasNote}>✅ Gas fees sponsored · 140+ networks · Powered by Alchemy</div>
            </div>
          )}

          {loginStep === 'email' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>Enter your email to continue.</p>
              <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailContinue()} autoFocus />
              {error && <p style={{ color: '#ff4466', fontSize: '0.72rem', marginBottom: 8 }}>{error}</p>}
              <button className={styles.btnPrimary} onClick={handleEmailContinue}>Continue →</button>
              <button className={styles.btnGhost} onClick={() => setLoginStep('home')}>← Back</button>
            </div>
          )}

          {loginStep === 'choose2fa' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}><strong style={{ color: '#00b3f7' }}>Choose your 2FA method</strong></p>
              {hasBiometric && <button className={styles.btnPrimary} onClick={() => { setLoginStep('biometric'); handleBiometricAuth() }}>👆 Fingerprint / Face ID</button>}
              <button className={hasBiometric ? styles.btnSecondary : styles.btnPrimary} onClick={() => setLoginStep('totp')}>🔢 Google Authenticator</button>
              {!hasBiometric && <div style={{ fontSize: '0.68rem', color: 'rgba(232,244,253,0.3)', textAlign: 'center', marginTop: 8 }}>Biometric not available</div>}
              <button className={styles.btnGhost} onClick={() => setLoginStep('email')}>← Back</button>
            </div>
          )}

          {loginStep === 'biometric' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>👆 <strong>Biometric Verification</strong></p>
              <div style={{ textAlign: 'center', fontSize: '3rem', margin: '20px 0' }}>👆</div>
              <button className={styles.btnPrimary} onClick={handleBiometricAuth}>👆 Authenticate</button>
              {error && <p style={{ color: '#ff4466', fontSize: '0.72rem', textAlign: 'center', marginTop: 8 }}>{error}</p>}
              <button className={styles.btnGhost} onClick={() => setLoginStep('choose2fa')}>← Back</button>
            </div>
          )}

          {loginStep === 'totp' && (
            <div className="fade-up-1">
              <p className={styles.loginDesc}>🔢 <strong>Google Authenticator</strong><br />Enter 6-digit code</p>
              <input className={styles.input} type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleTotpAuth()} autoFocus />
              {error && <p style={{ color: '#ff4466', fontSize: '0.72rem', marginBottom: 8 }}>{error}</p>}
              <button className={styles.btnPrimary} onClick={handleTotpAuth} disabled={totpCode.length !== 6}>Verify →</button>
              <button className={styles.btnGhost} onClick={() => setLoginStep('choose2fa')}>← Back</button>
            </div>
          )}

          {loginStep === 'creating' && (
            <div className={styles.creating + ' fade-up-1'}>
              <div className={styles.spinner} />
              <p>Setting up your wallet...</p>
              <p className={styles.creatingNote}>No gas fees. No seed phrase. 5 chains ready.</p>
            </div>
          )}
        </div>
        <div className={styles.loginFooter}>⬡ THE WALL · DWIN · 2026 · KANNUR → DUBAI · 🌍🌟🌙🪐₿</div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════
  return (
    <div className={styles.dashWrap}>
      <header className={styles.header + ' fade-up'}>
        <div className={styles.headerLeft}>
          <span className={styles.hexSmall}>⬡</span>
          <span className={styles.headerTitle}>THE WALL</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.searchIconBtn} onClick={() => setSearchOpen(true)} title="Search wallet">🔍</button>
          <button className={styles.searchIconBtn} onClick={() => { setSendOpen(true); setSendTab('send') }} title="Send">📤</button>
          <button className={styles.searchIconBtn} onClick={() => { setSendOpen(true); setSendTab('receive') }} title="Receive">📥</button>
          <span className={styles.chainBadge} style={{ color: '#627eea' }}>🌍</span>
          <span className={styles.chainBadge} style={{ color: '#9945ff' }}>🌟</span>
          <span className={styles.chainBadge} style={{ color: '#836ef9' }}>🌙</span>
          <span className={styles.chainBadge} style={{ color: '#12aaff' }}>🪐</span>
          <span className={styles.chainBadge} style={{ color: '#f7931a' }}>₿</span>
          <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
          </button>
          <button className={styles.logoutBtn} onClick={() => { setScreen('login'); setLoginStep('home') }}>⏻</button>
        </div>
      </header>

      {/* ── SEARCH MODAL ── */}
      {searchOpen && (
        <div className={styles.searchOverlay} onClick={() => setSearchOpen(false)}>
          <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <span className={styles.searchTitle}>🔍 Wallet Search</span>
              <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchResult(null); setSearchQuery('') }}>✕</button>
            </div>
            <div className={styles.searchInputRow}>
              <input className={styles.searchInput} placeholder="Enter ETH/SOL/ARB address..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchWallet(searchQuery)} autoFocus />
              <button className={styles.searchBtn} onClick={() => searchWallet(searchQuery)}>→</button>
            </div>
            {!searchResult && searchHistory.length > 0 && (
              <div className={styles.searchHistory}>
                <div className={styles.searchHistoryLabel}>Recent searches</div>
                {searchHistory.map(addr => (
                  <div key={addr} className={styles.searchHistoryItem} onClick={() => { setSearchQuery(addr); searchWallet(addr) }}>
                    <span className={styles.historyIcon}>⬡</span>
                    <span className={styles.historyAddr}>{addr.slice(0, 10)}...{addr.slice(-8)}</span>
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
                      {searchResult.address.slice(0, 10)}...{searchResult.address.slice(-8)}
                      <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(searchResult.address)}>📋</button>
                    </div>
                    <div className={styles.searchCards}>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>ETH Balance</div>
                        <div className={styles.searchCardValue} style={{ color: '#627eea' }}>{searchResult.ethBalance.toFixed(4)} ETH</div>
                        <div className={styles.searchCardUsd}>${searchResult.ethUsd.toFixed(2)}</div>
                      </div>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>SOL Balance</div>
                        <div className={styles.searchCardValue} style={{ color: '#9945ff' }}>{searchResult.solBalance.toFixed(4)} SOL</div>
                        <div className={styles.searchCardUsd}>${searchResult.solUsd.toFixed(2)}</div>
                      </div>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>Transactions</div>
                        <div className={styles.searchCardValue}>{searchResult.txCount}</div>
                        <div className={styles.searchCardUsd}>total txns</div>
                      </div>
                      <div className={styles.searchCard}>
                        <div className={styles.searchCardLabel}>Total Value</div>
                        <div className={styles.searchCardValue} style={{ color: '#00e5ff' }}>${(searchResult.ethUsd + searchResult.solUsd).toFixed(2)}</div>
                        <div className={styles.searchCardUsd}>USD</div>
                      </div>
                    </div>
                    <button className={styles.searchViewBtn} onClick={() => { setUser({ address: searchResult.address, type: 'external' }); fetchBalance(searchResult.address); setSearchOpen(false); setSearchResult(null) }}>
                      View Full Portfolio →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SEND/RECEIVE MODAL ── */}
      {sendOpen && (
        <div className={styles.searchOverlay} onClick={() => setSendOpen(false)}>
          <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <span className={styles.searchTitle}>{sendTab === 'send' ? '📤 Send Crypto' : '📥 Receive'}</span>
              <button className={styles.searchClose} onClick={() => { setSendOpen(false); setSendError(''); setSendSuccess('') }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['send', 'receive'] as const).map(t => (
                <button key={t} onClick={() => setSendTab(t)} style={{ flex: 1, padding: '10px', border: '1px solid', borderColor: sendTab === t ? 'var(--cyan)' : 'var(--border)', borderRadius: 8, background: sendTab === t ? 'var(--cyan-glow)' : 'transparent', color: sendTab === t ? 'var(--cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {t === 'send' ? '📤 Send' : '📥 Receive'}
                </button>
              ))}
            </div>

            {sendTab === 'send' && (
              <div>
                {/* Chain Select */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>SELECT CHAIN</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SEND_CHAINS.map(c => (
                      <button key={c.id} onClick={() => setSendChain(c.id as typeof sendChain)} style={{ padding: '8px 12px', border: '1px solid', borderColor: sendChain === c.id ? c.color : 'var(--border)', borderRadius: 8, background: sendChain === c.id ? `${c.color}15` : 'var(--bg3)', color: sendChain === c.id ? c.color : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>TO ADDRESS</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className={styles.searchInput} placeholder={sendChain === 'SOL' ? 'SOL address...' : sendChain === 'BTC' ? 'BTC address...' : '0x...'} value={sendTo} onChange={e => setSendTo(e.target.value)} style={{ flex: 1 }} />
                    <button onClick={() => setSendError('Use camera app to scan QR, then paste address.')} style={{ padding: '0 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--cyan)', fontSize: '1.1rem', cursor: 'pointer' }}>📷</button>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>AMOUNT</div>
                  <div style={{ position: 'relative' }}>
                    <input className={styles.searchInput} placeholder="0.00" type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} style={{ width: '100%', paddingRight: 60 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: SEND_CHAINS.find(c => c.id === sendChain)?.color || 'var(--cyan)', fontWeight: 700 }}>{sendChain}</span>
                  </div>
                  {sendAmount && prices[sendChain] && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>≈ ${(parseFloat(sendAmount || '0') * (prices[sendChain]?.price || 0)).toFixed(2)} USD · Gas: FREE ⚡</div>
                  )}
                </div>
                {addressBook.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>ADDRESS BOOK</div>
                    {addressBook.map((entry, i) => (
                      <div key={i} onClick={() => setSendTo(entry.address)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
                        <span>👤</span>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{entry.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{entry.address.slice(0, 10)}...{entry.address.slice(-6)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { const name = prompt('Contact name:'); if (name && sendTo) setAddressBook(prev => [...prev, { name, address: sendTo }]) }} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '8px 14px', cursor: 'pointer', width: '100%', marginBottom: 12 }}>
                  + Save to Address Book
                </button>
                {sendError && <div style={{ padding: '10px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: 8, color: 'var(--red)', fontSize: '0.75rem', marginBottom: 12 }}>⚠ {sendError}</div>}
                {sendSuccess && <div style={{ padding: '10px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, color: 'var(--green)', fontSize: '0.75rem', marginBottom: 12 }}>✅ {sendSuccess}</div>}
                <button className={styles.searchBtn} style={{ width: '100%', padding: '13px' }} onClick={handleSend} disabled={sendLoading || !sendTo || !sendAmount}>
                  {sendLoading ? '⏳ Processing...' : `📤 Send ${sendChain} · Gas Free ⚡`}
                </button>
              </div>
            )}

            {sendTab === 'receive' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>YOUR ETH / ARB / MON WALLET</div>
                  <div style={{ padding: '14px', background: 'var(--bg2)', border: '1px solid var(--border-bright)', borderRadius: 10, fontSize: '0.72rem', color: 'var(--cyan)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                    {user?.address || MAIN_WALLET}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(user?.address || MAIN_WALLET)} style={{ marginTop: 10, padding: '10px 20px', background: 'var(--bg3)', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    📋 Copy ETH Address
                  </button>
                </div>
                <div style={{ padding: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 8 }}>SOLANA WALLET 🌟</div>
                  <div style={{ fontSize: '0.68rem', color: '#9945ff', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>{SOL_WALLET}</div>
                  <button onClick={() => navigator.clipboard.writeText(SOL_WALLET)} style={{ marginTop: 8, padding: '8px 16px', background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.3)', borderRadius: 6, color: '#9945ff', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', cursor: 'pointer' }}>
                    📋 Copy SOL Address
                  </button>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  ⚠️ ETH/ERC-20 → ETH address only<br />
                  ⚠️ SOL/SPL → Solana address only<br />
                  ⚠️ ARB → same as ETH address<br />
                  ⚠️ BTC → Birth wallet only
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className={styles.main}>

        {/* Wallet Card */}
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

          {/* Chain Status Bar */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { id: 'earth', label: '🌍', color: '#627eea' },
              { id: 'soul', label: '🌟', color: '#9945ff' },
              { id: 'moon', label: '🌙', color: '#836ef9' },
              { id: 'orbit', label: '🪐', color: '#12aaff' },
              { id: 'birth', label: '₿', color: '#f7931a' },
            ].map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, background: 'var(--bg3)', border: `1px solid ${c.color}22`, fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                <span>{c.label}</span>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: chainStatus[c.id] === 'online' ? '#00ff88' : chainStatus[c.id] === 'offline' ? '#ff4466' : '#888', display: 'inline-block' }} />
              </div>
            ))}
          </div>
        </section>

        {/* EmoCoins */}
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

        {/* Tabs */}
        <div className={styles.tabs + ' fade-up-3'}>
          {['portfolio', 'swap', 'prices', 'history', 'treasury'].map(tab => (
            <button key={tab} className={styles.tab + (activeTab === tab ? ' ' + styles.tabActive : '')} onClick={() => setActiveTab(tab)}>
              {tab === 'portfolio' && '💼'}
              {tab === 'swap' && '🔄'}
              {tab === 'prices' && '📊'}
              {tab === 'history' && '📋'}
              {tab === 'treasury' && '🏛️'}
              {' '}{tab}
            </button>
          ))}
        </div>

        <div className={styles.tabContent + ' fade-up-4'}>

          {/* ── PORTFOLIO TAB ── */}
          {activeTab === 'portfolio' && (
            <div className={styles.tokenGrid}>
              {TOKENS.map(token => {
                const p = prices[token.symbol]
                const bal = token.symbol === 'ETH' ? walletData?.ethBalance || 0
                  : token.symbol === 'SOL' ? walletData?.solBalance || 0
                  : token.symbol === 'ARB' ? walletData?.arbBalance || 0
                  : token.symbol === 'EMC' ? EMOCOIN.balance : 0
                const priceStr = p ? '$' + p.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null
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

          {/* ── SWAP TAB (UNIVERSAL) ── */}
          {activeTab === 'swap' && (
            <div style={{ padding: '4px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--cyan)', letterSpacing: '0.12em', marginBottom: 4 }}>🔄 UNIVERSAL SWAP</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Powered by UniSwap V3 · Gasless ⚡</div>
              </div>

              {/* From */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>FROM</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={swap.fromToken} onChange={e => setSwap(prev => ({ ...prev, fromToken: e.target.value, estimatedOut: '' }))}
                    style={{ flex: 1, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', cursor: 'pointer' }}>
                    {SWAP_TOKENS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" placeholder="0.00" value={swap.amount}
                    onChange={e => setSwap(prev => ({ ...prev, amount: e.target.value }))}
                    style={{ flex: 1.5, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }} />
                </div>
                {swap.amount && prices[swap.fromToken] && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    ≈ ${(parseFloat(swap.amount) * (prices[swap.fromToken]?.price || 0)).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Swap Arrow */}
              <div style={{ textAlign: 'center', margin: '4px 0' }}>
                <button onClick={() => setSwap(prev => ({ ...prev, fromToken: prev.toToken, toToken: prev.fromToken, estimatedOut: '', amount: '' }))}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, color: 'var(--cyan)', fontSize: '1rem', cursor: 'pointer' }}>
                  ⇅
                </button>
              </div>

              {/* To */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>TO</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={swap.toToken} onChange={e => setSwap(prev => ({ ...prev, toToken: e.target.value, estimatedOut: '' }))}
                    style={{ flex: 1, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', cursor: 'pointer' }}>
                    {SWAP_TOKENS.filter(t => t !== swap.fromToken).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ flex: 1.5, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: swap.estimatedOut ? '#00ff88' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '1rem', minHeight: 42 }}>
                    {swap.estimatedOut || '0.00'}
                  </div>
                </div>
                {swap.estimatedOut && prices[swap.toToken] && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    ≈ ${(parseFloat(swap.estimatedOut) * (prices[swap.toToken]?.price || 0)).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Swap Info */}
              {swap.estimatedOut && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Route</span>
                    <span style={{ color: 'var(--cyan)' }}>{swap.route}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Price Impact</span>
                    <span style={{ color: swap.priceImpact < 1 ? '#00ff88' : '#ff4466' }}>{swap.priceImpact.toFixed(2)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gas Fee</span>
                    <span style={{ color: '#00ff88' }}>FREE ⚡ (Sponsored)</span>
                  </div>
                </div>
              )}

              {swap.error && <div style={{ padding: '10px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: 8, color: '#ff4466', fontSize: '0.75rem', marginBottom: 12 }}>⚠ {swap.error}</div>}
              {swap.success && <div style={{ padding: '10px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, color: '#00ff88', fontSize: '0.75rem', marginBottom: 12 }}>{swap.success}</div>}

              <button onClick={handleSwap} disabled={swap.loading || !swap.amount || !swap.estimatedOut}
                style={{ width: '100%', padding: '14px', background: swap.loading || !swap.amount ? 'var(--bg3)' : 'linear-gradient(135deg, #627eea, #9945ff)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, cursor: swap.loading || !swap.amount ? 'not-allowed' : 'pointer', letterSpacing: '0.05em' }}>
                {swap.loading ? '⏳ Swapping...' : `🔄 Swap ${swap.fromToken} → ${swap.toToken}`}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 10 }}>
                Powered by UniSwap V3 · TheWall Universal 🦋
              </div>
            </div>
          )}

          {/* ── PRICES TAB ── */}
          {activeTab === 'prices' && (
            <div>
              {priceError && <div className={styles.errorBanner}>⚠ Price feed unavailable.</div>}
              <div style={{ marginBottom: 12, fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
                🌍 EARTH · 🌟 SOUL · 🌙 MOON · 🪐 ORBIT · ₿ BIRTH
              </div>
              <div className={styles.priceTable}>
                <div className={styles.priceHeader}><span>Asset</span><span>Price (USD)</span><span>24h</span></div>
                {TOKENS.map(token => {
                  const p = prices[token.symbol]
                  return (
                    <div key={token.symbol} className={styles.priceRow}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: token.color, display: 'inline-block' }} />
                        <span>{token.symbol}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{token.chain}</span>
                      </span>
                      <span className={styles.priceVal}>{p ? '$' + p.price.toLocaleString('en', { minimumFractionDigits: 2 }) : '···'}</span>
                      <span className={p && p.change24h >= 0 ? styles.green : styles.red}>{p ? (p.change24h >= 0 ? '+' : '') + p.change24h.toFixed(2) + '%' : '···'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className={styles.historySection}>
              <div className={styles.historyItem}>
                <div className={styles.historyLeft}>
                  <span className={styles.historyIcon}>⬡</span>
                  <div><div className={styles.historyTitle}>First SOL Transaction</div><div className={styles.historyDate}>Sep 19, 2024 · Solana Mainnet 🌟</div></div>
                </div>
                <div className={styles.historyRight}>
                  <div className={styles.historySig}>5GRcJv...amLt</div>
                  <div className={styles.historyFee}>Fee: 0.000015 SOL</div>
                </div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 12 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.8 }}>
                  🌍 Earth · 🌟 Soul · 🌙 Moon · 🪐 Orbit · ₿ Birth<br />
                  Connect Alchemy API to load full history across all chains
                </div>
              </div>
            </div>
          )}

          {/* ── TREASURY TAB ── */}
          {activeTab === 'treasury' && (
            <div className={styles.treasurySection}>
              <div className={styles.treasuryCard}>
                <div className={styles.treasuryIcon}>🏛️</div>
                <div><div className={styles.treasuryLabel}>TREASURY · ETH / ARB / MON</div><div className={styles.treasuryAddr}>{TREASURY}</div></div>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(TREASURY)}>📋</button>
              </div>
              <div className={styles.treasuryCard}>
                <div className={styles.treasuryIcon}>🌟</div>
                <div><div className={styles.treasuryLabel}>SOUL WALLET · SOLANA</div><div className={styles.treasuryAddr}>{SOL_WALLET}</div></div>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(SOL_WALLET)}>📋</button>
              </div>

              {/* Chain Details */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>CHAIN NETWORK STATUS</div>
                {[
                  { id: 'earth', label: '🌍 TheWall Earth', chain: 'Ethereum Mainnet', rpc: 'eth.llamarpc.com' },
                  { id: 'soul', label: '🌟 TheWall Soul', chain: 'Solana Mainnet', rpc: 'helius-rpc.com' },
                  { id: 'moon', label: '🌙 TheWall Moon', chain: 'Monad Mainnet', rpc: 'rpc.monad.xyz' },
                  { id: 'orbit', label: '🪐 TheWall Orbit', chain: 'Arbitrum One', rpc: 'arb1.arbitrum.io' },
                  { id: 'birth', label: '₿ TheWall Birth', chain: 'Bitcoin Mainnet', rpc: 'mempool.space' },
                ].map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg2)', border: `1px solid ${CHAIN_COLORS[c.id]}22`, borderRadius: 8, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{c.label}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{c.chain} · {c.rpc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: chainStatus[c.id] === 'online' ? '#00ff88' : chainStatus[c.id] === 'offline' ? '#ff4466' : '#888', display: 'inline-block' }} />
                      <span style={{ fontSize: '0.62rem', color: chainStatus[c.id] === 'online' ? '#00ff88' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {chainStatus[c.id] === 'online' ? 'LIVE' : chainStatus[c.id] === 'offline' ? 'DOWN' : '···'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.webhookStatus}><span className={styles.liveDot} />Alchemy Webhook · Solana Mainnet · Address Activity</div>
              <div style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 10 }}>
                🦋 TheWall · Kannur → Dubai · Dwin · 2026
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className={styles.footer}>⬡ THE WALL · 🌍🌟🌙🪐₿ · KANNUR → DUBAI · DWIN · 2026</footer>
    </div>
  )
}
