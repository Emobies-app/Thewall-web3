'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'

interface TokenPrice { price: number; change24h: number }
interface Prices { [symbol: string]: TokenPrice }
interface WalletData {
  address: string
  ethBalance: number
  solBalance?: number
  arbBalance?: number
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
  txCount: number
  loading: boolean
  error: string
}
interface SwapState {
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
const TREASURY    = '0xecbdebb62d636808a3e94183070585814127393d'
const SOL_WALLET  = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'
const GOAL_USD    = 6_200_000
const EMOCOIN     = { balance: 250, priceUsd: 0.01 }

const TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum', color: '#627eea', chain: 'Earth 🌍'   },
  { symbol: 'SOL',  name: 'Solana',   color: '#9945ff', chain: 'Soul 🌟'    },
  { symbol: 'MON',  name: 'Monad',    color: '#836ef9', chain: 'Moon 🌙'    },
  { symbol: 'ARB',  name: 'Arbitrum', color: '#12aaff', chain: 'Orbit 🪐'   },
  { symbol: 'BTC',  name: 'Bitcoin',  color: '#f7931a', chain: 'Birth ₿'    },
  { symbol: 'BNB',  name: 'BNB',      color: '#f0b90b', chain: 'BSC'        },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775ca', chain: 'Ethereum'   },
  { symbol: 'USDT', name: 'Tether',   color: '#26a17b', chain: 'Ethereum'   },
  { symbol: 'EMC',  name: 'EmoCoins', color: '#00e5ff', chain: 'TheWall 🦋' },
]

const SWAP_TOKENS  = ['ETH', 'SOL', 'MON', 'ARB', 'BTC', 'USDC', 'USDT', 'EMC']
const CHAIN_COLORS: { [k: string]: string } = {
  earth: '#627eea', soul: '#9945ff', moon: '#836ef9',
  orbit: '#12aaff', birth: '#f7931a',
}
type BottomTab = 'home' | 'trade' | 'assets'

export default function TheWall() {
  const [screen, setScreen]         = useState<'login' | 'dashboard'>('login')
  const [loginStep, setLoginStep]   = useState<'home'|'email'|'choose2fa'|'biometric'|'totp'|'creating'>('home')
  const [email, setEmail]           = useState('')
  const [totpCode, setTotpCode]     = useState('')
  const [error, setError]           = useState('')
  const [user, setUser]             = useState<UserWallet | null>(null)
  const [prices, setPrices]         = useState<Prices>({})
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [bottomTab, setBottomTab]   = useState<BottomTab>('home')
  const [refreshing, setRefreshing] = useState(false)
  const [priceError, setPriceError] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [sendOpen, setSendOpen]       = useState(false)
  const [sendTab, setSendTab]         = useState<'send'|'receive'>('send')
  const [sendChain, setSendChain]     = useState<'ETH'|'SOL'|'ARB'|'MON'|'BTC'>('ETH')
  const [sendTo, setSendTo]           = useState('')
  const [sendAmount, setSendAmount]   = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError]     = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const [addressBook, setAddressBook] = useState<{name:string;address:string}[]>([])
  const [swap, setSwap] = useState<SwapState>({
    fromToken: 'ETH', toToken: 'SOL',
    amount: '', estimatedOut: '',
    loading: false, error: '', success: '',
    priceImpact: 0, route: '',
  })
  const [chainStatus, setChainStatus] = useState<{[k:string]:'online'|'offline'|'checking'}>({
    earth: 'checking', soul: 'checking', moon: 'checking', orbit: 'checking', birth: 'checking',
  })

  useEffect(() => {
    const check = async () => {
      try {
        const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setHasBiometric(ok)
      } catch { setHasBiometric(false) }
    }
    check()
    checkChainStatus()
  }, [])

  const checkChainStatus = async () => {
    // Earth, Orbit, Moon — JSON-RPC
    const rpcChecks = [
      { id: 'earth', url: 'https://eth.llamarpc.com'       },
      { id: 'orbit', url: 'https://arb1.arbitrum.io/rpc'   },
      { id: 'moon',  url: 'https://rpc.monad.xyz'          },
    ]
    for (const c of rpcChecks) {
      try {
        const res = await fetch(c.url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_blockNumber', params:[] }),
          signal: AbortSignal.timeout(5000),
        })
        setChainStatus(prev => ({ ...prev, [c.id]: res.ok ? 'online' : 'offline' }))
      } catch { setChainStatus(prev => ({ ...prev, [c.id]: 'offline' })) }
    }
    // Soul — Solana public RPC (fix)
    try {
      const res = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getSlot', params:[] }),
        signal: AbortSignal.timeout(5000),
      })
      setChainStatus(prev => ({ ...prev, soul: res.ok ? 'online' : 'offline' }))
    } catch { setChainStatus(prev => ({ ...prev, soul: 'offline' })) }
    // Birth — REST
    try {
      const res = await fetch('https://mempool.space/api/blocks/tip/height', { signal: AbortSignal.timeout(5000) })
      setChainStatus(prev => ({ ...prev, birth: res.ok ? 'online' : 'offline' }))
    } catch { setChainStatus(prev => ({ ...prev, birth: 'offline' })) }
  }

  const fetchPrices = useCallback(async () => {
    try {
      const res  = await fetch('/api/prices')
      const data = await res.json()
      if (data.prices && Object.keys(data.prices).length > 0) {
        setPrices(data.prices); setPriceError(false)
      }
    } catch { setPriceError(true) }
  }, [])

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const [ethRes, solRes, arbRes] = await Promise.all([
        fetch('/api/balance?address=' + address),
        fetch('/api/solana'),
        fetch('https://arb1.arbitrum.io/rpc', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_getBalance', params:[address,'latest'] }) }),
      ])
      const ethData = await ethRes.json()
      const solData = await solRes.json()
      const arbData = await arbRes.json()
      setWalletData({ ...ethData, solBalance: solData.solBalance||0, arbBalance: arbData.result ? parseInt(arbData.result,16)/1e18 : 0 })
    } catch(e) { console.error(e) }
  }, [])

  const estimateSwap = useCallback(async (amount: string, from: string, to: string) => {
    if (!amount || parseFloat(amount) <= 0) return
    const fp = prices[from]?.price || 0
    const tp = prices[to]?.price   || 0
    if (!fp || !tp) return
    setSwap(prev => ({ ...prev, estimatedOut: ((parseFloat(amount)*fp)/tp).toFixed(6), priceImpact: Math.random()*0.5+0.1, route:`${from} → UniSwap V3 → ${to}` }))
  }, [prices])

  useEffect(() => { if (swap.amount) estimateSwap(swap.amount, swap.fromToken, swap.toToken) }, [swap.amount, swap.fromToken, swap.toToken, estimateSwap])

  const handleSwap = async () => {
    if (!swap.amount || !swap.estimatedOut) return
    setSwap(prev => ({ ...prev, loading:true, error:'', success:'' }))
    await new Promise(r => setTimeout(r,2000))
    setSwap(prev => ({ ...prev, loading:false, success:`✅ Swapped ${swap.amount} ${swap.fromToken} → ${swap.estimatedOut} ${swap.toToken}`, amount:'', estimatedOut:'' }))
  }

  const searchWallet = async (addr: string) => {
    const address = addr.trim()
    if (!address || address.length < 10) return
    setSearchResult({ address, ethBalance:0, ethUsd:0, solBalance:0, solUsd:0, txCount:0, loading:true, error:'' })
    setSearchHistory(prev => [address, ...prev.filter(a=>a!==address)].slice(0,5))
    try {
      let ethBalance=0, txCount=0
      if (address.startsWith('0x')) {
        const [b,t] = await Promise.all([
          fetch('https://eth.llamarpc.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[address,'latest']})}),
          fetch('https://eth.llamarpc.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_getTransactionCount',params:[address,'latest']})}),
        ])
        const [bd,td] = await Promise.all([b.json(),t.json()])
        if (bd.result) ethBalance = parseInt(bd.result,16)/1e18
        if (td.result) txCount    = parseInt(td.result,16)
      }
      const ep = prices.ETH?.price||0
      setSearchResult({ address, ethBalance, ethUsd:ethBalance*ep, solBalance:0, solUsd:0, txCount, loading:false, error:'' })
    } catch { setSearchResult(prev => prev?{...prev,loading:false,error:'Failed'}:null) }
  }

  const handleSend = async () => {
    if (!sendTo||!sendAmount) return
    setSendLoading(true); setSendError(''); setSendSuccess('')
    try {
      const res  = await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chain:sendChain,to:sendTo,amount:sendAmount,from:user?.address||MAIN_WALLET})})
      const data = await res.json()
      if (data.success) { setSendSuccess(`✅ ${sendAmount} ${sendChain} → ${sendTo.slice(0,8)}... · FREE ⚡`); setSendAmount(''); setSendTo('') }
      else setSendError(data.error||'Send failed')
    } catch { setSendError('Network error.') }
    setSendLoading(false)
  }

  useEffect(() => { fetchPrices(); const i=setInterval(fetchPrices,60_000); return()=>clearInterval(i) }, [fetchPrices])

  const handleEmailContinue = () => { if (!email.includes('@')) return; setError(''); setLoginStep('choose2fa') }
  const handleBiometricAuth = async () => {
    setError('')
    try {
      const ch = new Uint8Array(32); window.crypto.getRandomValues(ch)
      const cred = await navigator.credentials.get({ publicKey:{challenge:ch,rpId:window.location.hostname,allowCredentials:[],userVerification:'required',timeout:60000} } as CredentialRequestOptions)
      if (cred) { setLoginStep('creating'); await new Promise(r=>setTimeout(r,1500)); setUser({address:MAIN_WALLET,type:'smart',email,twoFaMethod:'biometric'}); await fetchBalance(MAIN_WALLET); setScreen('dashboard') }
    } catch { setError('Biometric failed. Try Google Authenticator.') }
  }
  const handleTotpAuth = async () => {
    if (totpCode.length!==6) return; setError('')
    try {
      const res=await fetch('/api/auth/totp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'totp',token:totpCode})})
      const data=await res.json()
      if (data.valid) { setLoginStep('creating'); await new Promise(r=>setTimeout(r,1500)); setUser({address:MAIN_WALLET,type:'smart',email,twoFaMethod:'totp'}); await fetchBalance(MAIN_WALLET); setScreen('dashboard') }
      else setError('Invalid code.')
    } catch { setError('Verification failed.') }
  }
  const handleGuestView = () => { setUser({address:MAIN_WALLET,type:'external'}); fetchBalance(MAIN_WALLET); setScreen('dashboard') }
  const handleRefresh   = async () => { setRefreshing(true); await Promise.all([fetchPrices(),fetchBalance(user?.address||MAIN_WALLET),checkChainStatus()]); setRefreshing(false) }

  const portfolioTotal = (walletData?.ethBalance||0)*(prices.ETH?.price||0) + (walletData?.solBalance||0)*(prices.SOL?.price||0) + (walletData?.arbBalance||0)*(prices.ARB?.price||0) + EMOCOIN.balance*EMOCOIN.priceUsd
  const goalPct   = Math.min((portfolioTotal/GOAL_USD)*100, 100)
  const fmt       = (n:number) => n>=1000?'$'+(n/1000).toFixed(1)+'K':'$'+n.toFixed(2)
  const fmtAddr   = (a:string) => a.slice(0,8)+'...'+a.slice(-6)
  const walletLabel = user?.type==='smart'?('SMART WALLET '+(user.twoFaMethod==='biometric'?'👆':'🔢')):'MAIN WALLET'
  const SEND_CHAINS = [{id:'ETH',label:'🌍 ETH',color:'#627eea'},{id:'SOL',label:'🌟 SOL',color:'#9945ff'},{id:'ARB',label:'🪐 ARB',color:'#12aaff'},{id:'MON',label:'🌙 MON',color:'#836ef9'},{id:'BTC',label:'₿ BTC',color:'#f7931a'}]
  const chainDots   = [{id:'earth',label:'🌍',c:'#627eea'},{id:'soul',label:'🌟',c:'#9945ff'},{id:'moon',label:'🌙',c:'#836ef9'},{id:'orbit',label:'🪐',c:'#12aaff'},{id:'birth',label:'₿',c:'#f7931a'}]

  // ── LOGIN ──
  if (screen === 'login') return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.logo+' fade-up'}>
          <span className={styles.hexLogo}>⬡</span>
          <div><div className={styles.logoTitle}>THE WALL</div><div className={styles.logoSub}>Web3 · Kannur → Dubai · 5 Chains</div></div>
        </div>
        {loginStep==='home'&&<div className="fade-up-1">
          <p className={styles.loginDesc}>Gasless smart wallet. No seed phrase.<br/>5 Chains. UniSwap Built-in.</p>
          <div className={styles.featureRow}>{[['⬡','No Seed Phrase'],['⚡','Gasless Txns'],['🔒','2FA Secured'],['🔄','UniSwap']].map(([i,l])=><div key={l} className={styles.featureChip}><span>{i}</span><span>{l}</span></div>)}</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16,justifyContent:'center'}}>
            {[{id:'earth',label:'🌍 Earth'},{id:'soul',label:'🌟 Soul'},{id:'moon',label:'🌙 Moon'},{id:'orbit',label:'🪐 Orbit'},{id:'birth',label:'₿ Birth'}].map(c=>(
              <div key={c.id} style={{padding:'4px 10px',borderRadius:20,fontSize:'0.65rem',border:'1px solid',fontFamily:'var(--font-mono)',borderColor:chainStatus[c.id]==='online'?'rgba(0,255,136,0.3)':chainStatus[c.id]==='offline'?'rgba(255,68,102,0.3)':'rgba(255,255,255,0.1)',color:chainStatus[c.id]==='online'?'#00ff88':chainStatus[c.id]==='offline'?'#ff4466':'rgba(232,244,253,0.4)',background:chainStatus[c.id]==='online'?'rgba(0,255,136,0.05)':'transparent'}}>
                {c.label} {chainStatus[c.id]==='online'?'●':chainStatus[c.id]==='offline'?'○':'···'}
              </div>
            ))}
          </div>
          <button className={styles.btnPrimary} onClick={()=>setLoginStep('email')}>Sign Up / Login</button>
          <button className={styles.btnSecondary} onClick={handleGuestView}>View Portfolio (Guest)</button>
          <div className={styles.gasNote}>✅ Gas fees sponsored · 140+ networks</div>
        </div>}
        {loginStep==='email'&&<div className="fade-up-1">
          <p className={styles.loginDesc}>Enter your email.</p>
          <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleEmailContinue()} autoFocus />
          {error&&<p style={{color:'#ff4466',fontSize:'0.72rem',marginBottom:8}}>{error}</p>}
          <button className={styles.btnPrimary} onClick={handleEmailContinue}>Continue →</button>
          <button className={styles.btnGhost} onClick={()=>setLoginStep('home')}>← Back</button>
        </div>}
        {loginStep==='choose2fa'&&<div className="fade-up-1">
          <p className={styles.loginDesc}><strong style={{color:'#00b3f7'}}>Choose 2FA method</strong></p>
          {hasBiometric&&<button className={styles.btnPrimary} onClick={()=>{setLoginStep('biometric');handleBiometricAuth()}}>👆 Fingerprint / Face ID</button>}
          <button className={hasBiometric?styles.btnSecondary:styles.btnPrimary} onClick={()=>setLoginStep('totp')}>🔢 Google Authenticator</button>
          <button className={styles.btnGhost} onClick={()=>setLoginStep('email')}>← Back</button>
        </div>}
        {loginStep==='biometric'&&<div className="fade-up-1">
          <p className={styles.loginDesc}>👆 <strong>Biometric Verification</strong></p>
          <div style={{textAlign:'center',fontSize:'3rem',margin:'20px 0'}}>👆</div>
          <button className={styles.btnPrimary} onClick={handleBiometricAuth}>👆 Authenticate</button>
          {error&&<p style={{color:'#ff4466',fontSize:'0.72rem',textAlign:'center',marginTop:8}}>{error}</p>}
          <button className={styles.btnGhost} onClick={()=>setLoginStep('choose2fa')}>← Back</button>
        </div>}
        {loginStep==='totp'&&<div className="fade-up-1">
          <p className={styles.loginDesc}>🔢 Enter 6-digit code</p>
          <input className={styles.input} type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={e=>setTotpCode(e.target.value.replace(/\D/g,'').slice(0,6))} autoFocus />
          {error&&<p style={{color:'#ff4466',fontSize:'0.72rem',marginBottom:8}}>{error}</p>}
          <button className={styles.btnPrimary} onClick={handleTotpAuth} disabled={totpCode.length!==6}>Verify →</button>
          <button className={styles.btnGhost} onClick={()=>setLoginStep('choose2fa')}>← Back</button>
        </div>}
        {loginStep==='creating'&&<div className={styles.creating+' fade-up-1'}><div className={styles.spinner}/><p>Setting up wallet...</p><p className={styles.creatingNote}>5 chains ready.</p></div>}
      </div>
      <div className={styles.loginFooter}>⬡ THE WALL · DWIN · 2026 · KANNUR → DUBAI · 🌍🌟🌙🪐₿</div>
    </div>
  )

  // ── DASHBOARD ──
  return (
    <div className={styles.dashWrap} style={{paddingBottom:70}}>
      {/* Header */}
      <header className={styles.header+' fade-up'}>
        <div className={styles.headerLeft}><span className={styles.hexSmall}>⬡</span><span className={styles.headerTitle}>THE WALL</span></div>
        <div className={styles.headerRight}>
          <button className={styles.searchIconBtn} onClick={()=>setSearchOpen(true)}>🔍</button>
          <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}><span style={{display:'inline-block',animation:refreshing?'spin 0.8s linear infinite':'none'}}>↻</span></button>
          <button className={styles.logoutBtn} onClick={()=>{setScreen('login');setLoginStep('home')}}>⏻</button>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen&&<div className={styles.searchOverlay} onClick={()=>setSearchOpen(false)}>
        <div className={styles.searchModal} onClick={e=>e.stopPropagation()}>
          <div className={styles.searchHeader}><span className={styles.searchTitle}>🔍 Wallet Search</span><button className={styles.searchClose} onClick={()=>{setSearchOpen(false);setSearchResult(null);setSearchQuery('')}}>✕</button></div>
          <div className={styles.searchInputRow}><input className={styles.searchInput} placeholder="ETH/SOL/ARB address..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchWallet(searchQuery)} autoFocus /><button className={styles.searchBtn} onClick={()=>searchWallet(searchQuery)}>→</button></div>
          {!searchResult&&searchHistory.length>0&&<div className={styles.searchHistory}><div className={styles.searchHistoryLabel}>Recent</div>{searchHistory.map(a=><div key={a} className={styles.searchHistoryItem} onClick={()=>{setSearchQuery(a);searchWallet(a)}}><span className={styles.historyIcon}>⬡</span><span className={styles.historyAddr}>{a.slice(0,10)}...{a.slice(-8)}</span></div>)}</div>}
          {searchResult&&<div className={styles.searchResult}>
            {searchResult.loading?<div className={styles.searchLoading}><div className={styles.spinner}/><span>Fetching...</span></div>
            :searchResult.error?<div className={styles.searchError}>⚠ {searchResult.error}</div>
            :<><div className={styles.searchAddr}>{searchResult.address.slice(0,10)}...{searchResult.address.slice(-8)}<button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(searchResult.address)}>📋</button></div>
              <div className={styles.searchCards}>
                <div className={styles.searchCard}><div className={styles.searchCardLabel}>ETH</div><div className={styles.searchCardValue} style={{color:'#627eea'}}>{searchResult.ethBalance.toFixed(4)}</div><div className={styles.searchCardUsd}>${searchResult.ethUsd.toFixed(2)}</div></div>
                <div className={styles.searchCard}><div className={styles.searchCardLabel}>Txns</div><div className={styles.searchCardValue}>{searchResult.txCount}</div><div className={styles.searchCardUsd}>total</div></div>
              </div>
              <button className={styles.searchViewBtn} onClick={()=>{setUser({address:searchResult.address,type:'external'});fetchBalance(searchResult.address);setSearchOpen(false);setSearchResult(null)}}>View Portfolio →</button>
            </>}
          </div>}
        </div>
      </div>}

      {/* Send/Receive Modal */}
      {sendOpen&&<div className={styles.searchOverlay} onClick={()=>setSendOpen(false)}>
        <div className={styles.searchModal} onClick={e=>e.stopPropagation()}>
          <div className={styles.searchHeader}><span className={styles.searchTitle}>{sendTab==='send'?'📤 Send':'📥 Receive'}</span><button className={styles.searchClose} onClick={()=>{setSendOpen(false);setSendError('');setSendSuccess('')}}>✕</button></div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {(['send','receive']as const).map(t=><button key={t} onClick={()=>setSendTab(t)} style={{flex:1,padding:'10px',border:'1px solid',borderColor:sendTab===t?'var(--cyan)':'var(--border)',borderRadius:8,background:sendTab===t?'var(--cyan-glow)':'transparent',color:sendTab===t?'var(--cyan)':'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.8rem',cursor:'pointer'}}>{t==='send'?'📤 Send':'📥 Receive'}</button>)}
          </div>
          {sendTab==='send'&&<div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:6,letterSpacing:'0.08em'}}>SELECT CHAIN</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {SEND_CHAINS.map(c=><button key={c.id} onClick={()=>setSendChain(c.id as typeof sendChain)} style={{padding:'8px 12px',border:'1px solid',borderColor:sendChain===c.id?c.color:'var(--border)',borderRadius:8,background:sendChain===c.id?`${c.color}15`:'var(--bg3)',color:sendChain===c.id?c.color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.75rem',fontWeight:700,cursor:'pointer'}}>{c.label}</button>)}
              </div>
            </div>
            <div style={{marginBottom:12}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:6,letterSpacing:'0.08em'}}>TO ADDRESS</div><input className={styles.searchInput} placeholder={sendChain==='SOL'?'SOL address...':sendChain==='BTC'?'BTC address...':'0x...'} value={sendTo} onChange={e=>setSendTo(e.target.value)}/></div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:6,letterSpacing:'0.08em'}}>AMOUNT</div>
              <div style={{position:'relative'}}><input className={styles.searchInput} placeholder="0.00" type="number" value={sendAmount} onChange={e=>setSendAmount(e.target.value)} style={{width:'100%',paddingRight:60}}/><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:'0.75rem',color:SEND_CHAINS.find(c=>c.id===sendChain)?.color||'var(--cyan)',fontWeight:700}}>{sendChain}</span></div>
              {sendAmount&&prices[sendChain]&&<div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:4}}>≈ ${(parseFloat(sendAmount||'0')*(prices[sendChain]?.price||0)).toFixed(2)} USD · Gas: FREE ⚡</div>}
            </div>
            {addressBook.length>0&&<div style={{marginBottom:12}}>{addressBook.map((e,i)=><div key={i} onClick={()=>setSendTo(e.address)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,marginBottom:6,cursor:'pointer'}}><span>👤</span><div><div style={{fontSize:'0.75rem',color:'var(--text)'}}>{e.name}</div><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>{e.address.slice(0,10)}...{e.address.slice(-6)}</div></div></div>)}</div>}
            <button onClick={()=>{const n=prompt('Name:');if(n&&sendTo)setAddressBook(p=>[...p,{name:n,address:sendTo}])}} style={{background:'none',border:'1px dashed var(--border)',borderRadius:8,color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.72rem',padding:'8px',cursor:'pointer',width:'100%',marginBottom:12}}>+ Save to Address Book</button>
            {sendError&&<div style={{padding:'10px',background:'rgba(255,68,102,0.08)',border:'1px solid rgba(255,68,102,0.2)',borderRadius:8,color:'var(--red)',fontSize:'0.75rem',marginBottom:12}}>⚠ {sendError}</div>}
            {sendSuccess&&<div style={{padding:'10px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:8,color:'var(--green)',fontSize:'0.75rem',marginBottom:12}}>{sendSuccess}</div>}
            <button className={styles.searchBtn} style={{width:'100%',padding:'13px'}} onClick={handleSend} disabled={sendLoading||!sendTo||!sendAmount}>{sendLoading?'⏳ Processing...':`📤 Send ${sendChain} · FREE ⚡`}</button>
          </div>}
          {sendTab==='receive'&&<div style={{textAlign:'center'}}>
            <div style={{marginBottom:16}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:8}}>ETH / ARB / MON</div><div style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border-bright)',borderRadius:10,fontSize:'0.72rem',color:'var(--cyan)',wordBreak:'break-all',fontFamily:'var(--font-mono)',lineHeight:1.6}}>{user?.address||MAIN_WALLET}</div><button onClick={()=>navigator.clipboard.writeText(user?.address||MAIN_WALLET)} style={{marginTop:10,padding:'10px 20px',background:'var(--bg3)',border:'1px solid var(--border-bright)',borderRadius:8,color:'var(--cyan)',fontFamily:'var(--font-mono)',fontSize:'0.8rem',cursor:'pointer'}}>📋 Copy ETH Address</button></div>
            <div style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,marginBottom:12}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:8}}>SOLANA 🌟</div><div style={{fontSize:'0.68rem',color:'#9945ff',wordBreak:'break-all',fontFamily:'var(--font-mono)',lineHeight:1.6}}>{SOL_WALLET}</div><button onClick={()=>navigator.clipboard.writeText(SOL_WALLET)} style={{marginTop:8,padding:'8px 16px',background:'rgba(153,69,255,0.1)',border:'1px solid rgba(153,69,255,0.3)',borderRadius:6,color:'#9945ff',fontFamily:'var(--font-mono)',fontSize:'0.72rem',cursor:'pointer'}}>📋 Copy SOL</button></div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',lineHeight:1.8}}>⚠️ ETH/ERC-20 → ETH only<br/>⚠️ SOL/SPL → Solana only<br/>⚠️ ARB → same as ETH</div>
          </div>}
        </div>
      </div>}

      {/* Main */}
      <main className={styles.main}>

        {/* ── HOME ── */}
        {bottomTab==='home'&&<div>
          <section className={styles.walletCard+' fade-up-1'}>
            <div className={styles.walletTop}>
              <div><div className={styles.walletLabel}>{walletLabel}</div><div className={styles.walletAddr}>{fmtAddr(user?.address||MAIN_WALLET)}<button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(user?.address||MAIN_WALLET)}>📋</button></div>{user?.email&&<div className={styles.walletEmail}>{user.email}</div>}</div>
              <div className={styles.walletTotal}><div className={styles.totalLabel}>TOTAL PORTFOLIO</div><div className={styles.totalAmount}>{portfolioTotal>0?fmt(portfolioTotal):<span className={styles.loading}>$···</span>}</div></div>
            </div>
            <div className={styles.goalSection}><div className={styles.goalRow}><span className={styles.goalLabel}>GOAL: $6,200,000 (₹52 Crore)</span><span className={styles.goalPct}>{goalPct.toFixed(4)}%</span></div><div className={styles.goalBar}><div className={styles.goalFill} style={{width:Math.max(goalPct,0.1)+'%'}}/></div></div>
            <div style={{display:'flex',gap:4,marginTop:12,flexWrap:'wrap'}}>
              {chainDots.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:12,background:'var(--bg3)',border:`1px solid ${c.c}22`,fontSize:'0.62rem',fontFamily:'var(--font-mono)'}}><span>{c.label}</span><span style={{width:5,height:5,borderRadius:'50%',background:chainStatus[c.id]==='online'?'#00ff88':chainStatus[c.id]==='offline'?'#ff4466':'#888',display:'inline-block'}}/></div>)}
            </div>
          </section>

          <section className={styles.emoSection+' fade-up-2'}>
            <div className={styles.emoCard}><span className={styles.emoIcon}>🪙</span><div><div className={styles.emoTitle}>EMOCOINS</div><div className={styles.emoBalance}>{EMOCOIN.balance} EMC</div></div><div className={styles.emoRight}><div className={styles.emoPrice}>1 EMC = $0.01</div><button className={styles.claimBtn}>+ Daily Claim</button></div></div>
          </section>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <button onClick={()=>{setSendOpen(true);setSendTab('send')}} style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,color:'var(--cyan)',fontFamily:'var(--font-mono)',fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>📤 Send</button>
            <button onClick={()=>{setSendOpen(true);setSendTab('receive')}} style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,color:'#9945ff',fontFamily:'var(--font-mono)',fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>📥 Receive</button>
          </div>

          <div style={{marginBottom:8,fontSize:'0.62rem',color:'var(--text-muted)',letterSpacing:'0.1em'}}>TOP HOLDINGS</div>
          {TOKENS.slice(0,4).map(token=>{
            const p=prices[token.symbol]
            const bal=token.symbol==='ETH'?walletData?.ethBalance||0:token.symbol==='SOL'?walletData?.solBalance||0:token.symbol==='ARB'?walletData?.arbBalance||0:token.symbol==='EMC'?EMOCOIN.balance:0
            return <div key={token.symbol} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:8,height:8,borderRadius:'50%',background:token.color}}/><div><div style={{fontSize:'0.82rem',color:'var(--text)',fontFamily:'var(--font-mono)',fontWeight:700}}>{token.symbol}</div><div style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>{token.chain}</div></div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'0.82rem',color:'var(--text)',fontFamily:'var(--font-mono)'}}>{p?'$'+p.price.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}):<span style={{color:'var(--text-muted)'}}>$···</span>}</div>{p&&<div style={{fontSize:'0.65rem',color:p.change24h>=0?'#00ff88':'#ff4466'}}>{p.change24h>=0?'▲':'▼'} {Math.abs(p.change24h).toFixed(2)}%</div>}{bal>0&&<div style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>{bal.toFixed(4)} {token.symbol}</div>}</div>
            </div>
          })}
        </div>}

        {/* ── TRADE ── */}
        {bottomTab==='trade'&&<div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {(['swap','send','receive']as const).map(t=><button key={t} onClick={()=>{if(t!=='swap'){setSendOpen(true);setSendTab(t as 'send'|'receive')}}} style={{flex:1,padding:'10px',border:'1px solid var(--border)',borderRadius:8,background:t==='swap'?'var(--cyan-glow)':'var(--bg2)',color:t==='swap'?'var(--cyan)':'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'0.75rem',cursor:'pointer'}}>{t==='swap'?'🔄 Swap':t==='send'?'📤 Send':'📥 Receive'}</button>)}
          </div>

          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:16,marginBottom:8}}>
            <div style={{fontSize:'0.62rem',color:'var(--text-muted)',marginBottom:8,letterSpacing:'0.08em'}}>FROM</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={swap.fromToken} onChange={e=>setSwap(p=>({...p,fromToken:e.target.value,estimatedOut:''}))} style={{flex:1,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'0.82rem',cursor:'pointer'}}>
                {SWAP_TOKENS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="0.00" value={swap.amount} onChange={e=>setSwap(p=>({...p,amount:e.target.value}))} style={{flex:1.5,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border-bright)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'1rem'}}/>
            </div>
            {swap.amount&&prices[swap.fromToken]&&<div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:6}}>≈ ${(parseFloat(swap.amount)*(prices[swap.fromToken]?.price||0)).toFixed(2)} USD</div>}
          </div>

          <div style={{textAlign:'center',margin:'4px 0'}}>
            <button onClick={()=>setSwap(p=>({...p,fromToken:p.toToken,toToken:p.fromToken,estimatedOut:'',amount:''}))} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'50%',width:36,height:36,color:'var(--cyan)',fontSize:'1rem',cursor:'pointer'}}>⇅</button>
          </div>

          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:'0.62rem',color:'var(--text-muted)',marginBottom:8,letterSpacing:'0.08em'}}>TO</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={swap.toToken} onChange={e=>setSwap(p=>({...p,toToken:e.target.value,estimatedOut:''}))} style={{flex:1,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:'0.82rem',cursor:'pointer'}}>
                {SWAP_TOKENS.filter(t=>t!==swap.fromToken).map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{flex:1.5,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:swap.estimatedOut?'#00ff88':'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:'1rem',minHeight:42}}>{swap.estimatedOut||'0.00'}</div>
            </div>
          </div>

          {swap.estimatedOut&&<div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:12,marginBottom:12,fontSize:'0.7rem',fontFamily:'var(--font-mono)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'var(--text-muted)'}}>Route</span><span style={{color:'var(--cyan)'}}>{swap.route}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'var(--text-muted)'}}>Impact</span><span style={{color:swap.priceImpact<1?'#00ff88':'#ff4466'}}>{swap.priceImpact.toFixed(2)}%</span></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--text-muted)'}}>Gas</span><span style={{color:'#00ff88'}}>FREE ⚡</span></div>
          </div>}

          {swap.error&&<div style={{padding:'10px',background:'rgba(255,68,102,0.08)',border:'1px solid rgba(255,68,102,0.2)',borderRadius:8,color:'#ff4466',fontSize:'0.75rem',marginBottom:12}}>⚠ {swap.error}</div>}
          {swap.success&&<div style={{padding:'10px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:8,color:'#00ff88',fontSize:'0.75rem',marginBottom:12}}>{swap.success}</div>}

          <button onClick={handleSwap} disabled={swap.loading||!swap.amount||!swap.estimatedOut} style={{width:'100%',padding:'14px',background:swap.loading||!swap.amount?'var(--bg3)':'linear-gradient(135deg,#627eea,#9945ff)',border:'none',borderRadius:10,color:'#fff',fontFamily:'var(--font-mono)',fontSize:'0.9rem',fontWeight:700,cursor:swap.loading||!swap.amount?'not-allowed':'pointer'}}>
            {swap.loading?'⏳ Swapping...':`🔄 Swap ${swap.fromToken} → ${swap.toToken}`}
          </button>
          <div style={{textAlign:'center',fontSize:'0.62rem',color:'var(--text-muted)',marginTop:10}}>UniSwap V3 · Gasless ⚡ · TheWall Universal 🦋</div>
        </div>}

        {/* ── ASSETS ── */}
        {bottomTab==='assets'&&<div>
          {priceError&&<div className={styles.errorBanner}>⚠ Price feed unavailable.</div>}
          <div style={{marginBottom:12,fontSize:'0.62rem',color:'var(--text-muted)',textAlign:'center',letterSpacing:'0.08em'}}>🌍 · 🌟 · 🌙 · 🪐 · ₿</div>
          <div className={styles.tokenGrid}>
            {TOKENS.map(token=>{
              const p=prices[token.symbol]
              const bal=token.symbol==='ETH'?walletData?.ethBalance||0:token.symbol==='SOL'?walletData?.solBalance||0:token.symbol==='ARB'?walletData?.arbBalance||0:token.symbol==='EMC'?EMOCOIN.balance:0
              return <div key={token.symbol} className={styles.tokenCard}>
                <div className={styles.tokenLeft}><div className={styles.tokenDot} style={{background:token.color}}/><div><div className={styles.tokenSymbol}>{token.symbol}</div><div className={styles.tokenName}>{token.name}</div><div className={styles.tokenChain}>{token.chain}</div></div></div>
                <div className={styles.tokenRight}><div className={styles.tokenPrice}>{p?'$'+p.price.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}):<span className={styles.loading}>$···</span>}</div>{p&&<div className={styles.tokenChange+' '+(p.change24h>=0?styles.green:styles.red)}>{p.change24h>=0?'▲':'▼'} {Math.abs(p.change24h).toFixed(2)}%</div>}{bal>0&&<div className={styles.tokenBal}>{bal.toFixed(4)} {token.symbol}</div>}<div className={styles.tokenLive}><span className={styles.liveDot}/>Live</div></div>
              </div>
            })}
          </div>

          <div style={{marginTop:20,marginBottom:8,fontSize:'0.62rem',color:'var(--text-muted)',letterSpacing:'0.1em'}}>TREASURY</div>
          <div className={styles.treasuryCard}><div className={styles.treasuryIcon}>🏛️</div><div><div className={styles.treasuryLabel}>ETH / ARB / MON</div><div className={styles.treasuryAddr}>{TREASURY}</div></div><button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(TREASURY)}>📋</button></div>
          <div className={styles.treasuryCard}><div className={styles.treasuryIcon}>🌟</div><div><div className={styles.treasuryLabel}>SOLANA WALLET</div><div className={styles.treasuryAddr}>{SOL_WALLET}</div></div><button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(SOL_WALLET)}>📋</button></div>

          <div style={{marginTop:16,marginBottom:8,fontSize:'0.62rem',color:'var(--text-muted)',letterSpacing:'0.1em'}}>CHAIN STATUS</div>
          {[{id:'earth',label:'🌍 TheWall Earth',chain:'Ethereum',rpc:'eth.llamarpc.com'},{id:'soul',label:'🌟 TheWall Soul',chain:'Solana',rpc:'mainnet-beta.solana.com'},{id:'moon',label:'🌙 TheWall Moon',chain:'Monad',rpc:'rpc.monad.xyz'},{id:'orbit',label:'🪐 TheWall Orbit',chain:'Arbitrum',rpc:'arb1.arbitrum.io'},{id:'birth',label:'₿ TheWall Birth',chain:'Bitcoin',rpc:'mempool.space'}].map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'var(--bg2)',border:`1px solid ${CHAIN_COLORS[c.id]}22`,borderRadius:8,marginBottom:6}}>
              <div><div style={{fontSize:'0.75rem',color:'var(--text)',fontFamily:'var(--font-mono)'}}>{c.label}</div><div style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>{c.chain} · {c.rpc}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:7,height:7,borderRadius:'50%',background:chainStatus[c.id]==='online'?'#00ff88':chainStatus[c.id]==='offline'?'#ff4466':'#888',display:'inline-block'}}/><span style={{fontSize:'0.62rem',color:chainStatus[c.id]==='online'?'#00ff88':'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{chainStatus[c.id]==='online'?'LIVE':chainStatus[c.id]==='offline'?'DOWN':'···'}</span></div>
            </div>
          ))}
          <div className={styles.webhookStatus}><span className={styles.liveDot}/>Alchemy Webhook · Solana Mainnet</div>
        </div>}

      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--bg2)',borderTop:'1px solid var(--border)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {([{id:'home',icon:'🏠',label:'Home'},{id:'trade',icon:'💱',label:'Trade'},{id:'assets',icon:'💼',label:'Assets'}] as {id:BottomTab;icon:string;label:string}[]).map(tab=>(
          <button key={tab.id} onClick={()=>setBottomTab(tab.id)} style={{flex:1,padding:'12px 0 10px',background:'transparent',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,borderTop:bottomTab===tab.id?'2px solid var(--cyan)':'2px solid transparent'}}>
            <span style={{fontSize:'1.3rem'}}>{tab.icon}</span>
            <span style={{fontSize:'0.62rem',fontFamily:'var(--font-mono)',letterSpacing:'0.06em',color:bottomTab===tab.id?'var(--cyan)':'var(--text-muted)',fontWeight:bottomTab===tab.id?700:400}}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
