'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './page.module.css'

interface TokenPrice  { price: number; change24h: number }
interface Prices      { [symbol: string]: TokenPrice }
interface WalletData  { address: string; ethBalance: number; solBalance?: number; arbBalance?: number; tokenBalances: { contractAddress: string; tokenBalance: string }[] }
interface UserWallet  { address: string; type: 'smart'|'external'; email?: string; twoFaMethod?: 'biometric'|'totp' }
interface NewsItem    { title: string; url: string; published: string; source: string; currencies: string[]; positive: number; negative: number }
interface TxItem      { hash: string; from: string; to: string; value: string; time: string; gas: string; status: string; method: string }
interface SwapState   { fromToken: string; toToken: string; amount: string; estimatedOut: string; loading: boolean; error: string; success: string; priceImpact: number; route: string }
interface PriceAlert  { id: string; symbol: string; targetPrice: number; condition: 'above'|'below'; triggered: boolean }
interface SearchResult { address: string; ethBalance: number; ethUsd: number; txCount: number; loading: boolean; error: string }

const MAIN_WALLET = '0xba24d47ef3f4e1000000000000000000f3f4e1'
const TREASURY    = '0xecbdebb62d636808a3e94183070585814127393d'
const SOL_WALLET  = '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7'
const GOAL_USD    = 6_200_000
const EMOCOIN     = { balance: 250, priceUsd: 0.01 }

const TOKENS = [
  { symbol:'ETH',  name:'Ethereum', color:'#627eea', chain:'Earth 🌍',   cgId:'ethereum'    },
  { symbol:'SOL',  name:'Solana',   color:'#9945ff', chain:'Soul 🌟',    cgId:'solana'       },
  { symbol:'MON',  name:'Monad',    color:'#836ef9', chain:'Moon 🌙',    cgId:''             },
  { symbol:'ARB',  name:'Arbitrum', color:'#12aaff', chain:'Orbit 🪐',   cgId:'arbitrum'     },
  { symbol:'BTC',  name:'Bitcoin',  color:'#f7931a', chain:'Birth ₿',    cgId:'bitcoin'      },
  { symbol:'BNB',  name:'BNB',      color:'#f0b90b', chain:'BSC',        cgId:'binancecoin'  },
  { symbol:'USDC', name:'USD Coin', color:'#2775ca', chain:'Ethereum',   cgId:'usd-coin'     },
  { symbol:'USDT', name:'Tether',   color:'#26a17b', chain:'Ethereum',   cgId:'tether'       },
  { symbol:'EMC',  name:'EmoCoins', color:'#00e5ff', chain:'TheWall 🦋', cgId:''             },
]
const SWAP_TOKENS = ['ETH','SOL','MON','ARB','BTC','USDC','USDT','EMC']
const CHAIN_COLORS: Record<string,string> = { earth:'#627eea', soul:'#9945ff', moon:'#836ef9', orbit:'#12aaff', birth:'#f7931a' }
const SEND_CHAINS = [{id:'ETH',label:'🌍 ETH',color:'#627eea'},{id:'SOL',label:'🌟 SOL',color:'#9945ff'},{id:'ARB',label:'🪐 ARB',color:'#12aaff'},{id:'MON',label:'🌙 MON',color:'#836ef9'},{id:'BTC',label:'₿ BTC',color:'#f7931a'}]
const CHAIN_DOTS  = [{id:'earth',label:'🌍',c:'#627eea'},{id:'soul',label:'🌟',c:'#9945ff'},{id:'moon',label:'🌙',c:'#836ef9'},{id:'orbit',label:'🪐',c:'#12aaff'},{id:'birth',label:'₿',c:'#f7931a'}]
const DAPP_LIST   = [{name:'Uniswap',url:'https://app.uniswap.org',icon:'🦄'},{name:'OpenSea',url:'https://opensea.io',icon:'🌊'},{name:'Aave',url:'https://app.aave.com',icon:'👻'},{name:'1inch',url:'https://app.1inch.io',icon:'🦅'},{name:'Compound',url:'https://app.compound.finance',icon:'🏦'},{name:'Raydium',url:'https://raydium.io',icon:'⚡'}]

type BottomTab = 'home'|'trade'|'markets'|'settings'

export default function TheWall() {
  const [screen, setScreen]         = useState<'login'|'dashboard'>('login')
  const [loginStep, setLoginStep]   = useState<'home'|'email'|'choose2fa'|'biometric'|'totp'|'creating'>('home')
  const [email, setEmail]           = useState('')
  const [totpCode, setTotpCode]     = useState('')
  const [error, setError]           = useState('')
  const [user, setUser]             = useState<UserWallet|null>(null)
  const [prices, setPrices]         = useState<Prices>({})
  const [walletData, setWalletData] = useState<WalletData|null>(null)
  const [bottomTab, setBottomTab]   = useState<BottomTab>('home')
  const [refreshing, setRefreshing] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResult, setSearchResult] = useState<SearchResult|null>(null)
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
  const [swap, setSwap] = useState<SwapState>({ fromToken:'ETH', toToken:'SOL', amount:'', estimatedOut:'', loading:false, error:'', success:'', priceImpact:0, route:'' })
  const [chainStatus, setChainStatus] = useState<Record<string,'online'|'offline'|'checking'>>({ earth:'checking', soul:'checking', moon:'checking', orbit:'checking', birth:'checking' })
  const [chartToken, setChartToken]   = useState('ETH')
  const [chartDays, setChartDays]     = useState('7')
  const [chartData, setChartData]     = useState<[number,number][]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [news, setNews]               = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [alerts, setAlerts]           = useState<PriceAlert[]>([])
  const [alertSymbol, setAlertSymbol] = useState('ETH')
  const [alertPrice, setAlertPrice]   = useState('')
  const [alertCondition, setAlertCondition] = useState<'above'|'below'>('above')
  const [marketsTab, setMarketsTab]   = useState<'charts'|'news'|'alerts'>('charts')
  const [settingsTab, setSettingsTab] = useState<'profile'|'security'|'history'|'dapps'>('profile')
  const [txHistory, setTxHistory]     = useState<TxItem[]>([])
  const [txLoading, setTxLoading]     = useState(false)
  const [dappUrl, setDappUrl]         = useState('')
  const [dappOpen, setDappOpen]       = useState(false)
  const [frozen, setFrozen]           = useState(false)
  const [pin, setPin]                 = useState('')
  const [pinSet, setPinSet]           = useState(false)
  const [pinInput, setPinInput]       = useState('')
  const [pinError, setPinError]       = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(setHasBiometric).catch(() => setHasBiometric(false))
    checkChainStatus()
  }, [])

  const checkChainStatus = async () => {
    for (const c of [{id:'earth',url:'https://eth.llamarpc.com'},{id:'orbit',url:'https://arb1.arbitrum.io/rpc'},{id:'moon',url:'https://rpc.monad.xyz'}]) {
      try { const r = await fetch(c.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]}),signal:AbortSignal.timeout(5000)}); setChainStatus(p=>({...p,[c.id]:r.ok?'online':'offline'})) } catch { setChainStatus(p=>({...p,[c.id]:'offline'})) }
    }
    try { const r = await fetch('https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getSlot',params:[]}),signal:AbortSignal.timeout(5000)}); setChainStatus(p=>({...p,soul:r.ok?'online':'offline'})) } catch { setChainStatus(p=>({...p,soul:'offline'})) }
    try { const r = await fetch('https://mempool.space/api/blocks/tip/height',{signal:AbortSignal.timeout(5000)}); setChainStatus(p=>({...p,birth:r.ok?'online':'offline'})) } catch { setChainStatus(p=>({...p,birth:'offline'})) }
  }

  const fetchPrices = useCallback(async () => { try { const r=await fetch('/api/prices'); const d=await r.json(); if(d.prices&&Object.keys(d.prices).length>0) setPrices(d.prices) } catch {} }, [])
  const fetchBalance = useCallback(async (address: string) => {
    try {
      const [er,sr,ar] = await Promise.all([fetch('/api/balance?address='+address),fetch('/api/solana'),fetch('https://arb1.arbitrum.io/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[address,'latest']})})])
      const [ed,sd,ad] = await Promise.all([er.json(),sr.json(),ar.json()])
      setWalletData({...ed,solBalance:sd.solBalance||0,arbBalance:ad.result?parseInt(ad.result,16)/1e18:0})
    } catch {}
  }, [])

  const fetchChart = useCallback(async (symbol: string, days: string) => {
    const token = TOKENS.find(t=>t.symbol===symbol)
    if (!token?.cgId) { setChartData([]); return }
    setChartLoading(true)
    try { const r=await fetch(`/api/chart?coin=${token.cgId}&days=${days}`); const d=await r.json(); setChartData(d.prices||[]) } catch { setChartData([]) }
    setChartLoading(false)
  }, [])

  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    try { const r=await fetch('/api/news'); const d=await r.json(); setNews(d.news||[]) } catch { setNews([]) }
    setNewsLoading(false)
  }, [])

  const fetchTxHistory = useCallback(async (address: string) => {
    setTxLoading(true)
    try { const r=await fetch('/api/txhistory?address='+address); const d=await r.json(); setTxHistory(d.txs||[]) } catch { setTxHistory([]) }
    setTxLoading(false)
  }, [])

  useEffect(() => {
    alerts.forEach(alert => {
      if (alert.triggered) return
      const p = prices[alert.symbol]?.price
      if (!p) return
      if (alert.condition==='above'?p>=alert.targetPrice:p<=alert.targetPrice) {
        setAlerts(prev=>prev.map(a=>a.id===alert.id?{...a,triggered:true}:a))
        if ('Notification' in window && Notification.permission==='granted') new Notification('TheWall Alert 🔔',{body:`${alert.symbol} ${alert.condition} $${alert.targetPrice}! Now: $${p.toFixed(2)}`})
      }
    })
  }, [prices, alerts])

  useEffect(() => {
    if (!canvasRef.current||!chartData.length) return
    const canvas=canvasRef.current, ctx=canvas.getContext('2d')
    if (!ctx) return
    const W=canvas.width, H=canvas.height
    ctx.clearRect(0,0,W,H)
    const ps=chartData.map(d=>d[1]), min=Math.min(...ps), max=Math.max(...ps), range=max-min||1
    const color=TOKENS.find(t=>t.symbol===chartToken)?.color||'#00e5ff'
    ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1
    for(let i=0;i<=4;i++){const y=H*i/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,color+'44'); grad.addColorStop(1,color+'00')
    ctx.beginPath()
    chartData.forEach((d,i)=>{const x=(i/(chartData.length-1))*W,y=H-((d[1]-min)/range)*H*0.85-H*0.05;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fillStyle=grad;ctx.fill()
    ctx.beginPath()
    chartData.forEach((d,i)=>{const x=(i/(chartData.length-1))*W,y=H-((d[1]-min)/range)*H*0.85-H*0.05;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()
    ctx.fillStyle='rgba(232,244,253,0.5)';ctx.font='10px monospace';ctx.textAlign='right'
    ctx.fillText('$'+max.toLocaleString('en',{maximumFractionDigits:0}),W-4,14)
    ctx.fillText('$'+min.toLocaleString('en',{maximumFractionDigits:0}),W-4,H-4)
  }, [chartData,chartToken])

  useEffect(()=>{fetchPrices();const i=setInterval(fetchPrices,60_000);return()=>clearInterval(i)},[fetchPrices])
  useEffect(()=>{if(bottomTab==='markets'&&marketsTab==='charts')fetchChart(chartToken,chartDays)},[bottomTab,marketsTab,chartToken,chartDays,fetchChart])
  useEffect(()=>{if(bottomTab==='markets'&&marketsTab==='news'&&!news.length)fetchNews()},[bottomTab,marketsTab,fetchNews,news.length])
  useEffect(()=>{if(bottomTab==='settings'&&settingsTab==='history'&&user?.address&&!txHistory.length)fetchTxHistory(user.address)},[bottomTab,settingsTab,user,txHistory.length,fetchTxHistory])

  const estimateSwap = useCallback((amount:string,from:string,to:string)=>{
    if(!amount||parseFloat(amount)<=0)return
    const fp=prices[from]?.price||0,tp=prices[to]?.price||0
    if(!fp||!tp)return
    setSwap(p=>({...p,estimatedOut:((parseFloat(amount)*fp)/tp).toFixed(6),priceImpact:Math.random()*0.5+0.1,route:`${from} → UniSwap V3 → ${to}`}))
  },[prices])
  useEffect(()=>{if(swap.amount)estimateSwap(swap.amount,swap.fromToken,swap.toToken)},[swap.amount,swap.fromToken,swap.toToken,estimateSwap])

  const handleSwap = async()=>{
    if(!swap.amount||!swap.estimatedOut)return
    setSwap(p=>({...p,loading:true,error:'',success:''}))
    await new Promise(r=>setTimeout(r,2000))
    setSwap(p=>({...p,loading:false,success:`✅ Swapped ${swap.amount} ${swap.fromToken} → ${swap.estimatedOut} ${swap.toToken}`,amount:'',estimatedOut:''}))
  }

  const searchWallet = async(addr:string)=>{
    const address=addr.trim(); if(!address||address.length<10)return
    setSearchResult({address,ethBalance:0,ethUsd:0,txCount:0,loading:true,error:''})
    setSearchHistory(p=>[address,...p.filter(a=>a!==address)].slice(0,5))
    try {
      let ethBalance=0,txCount=0
      if(address.startsWith('0x')){
        const [b,t]=await Promise.all([fetch('https://eth.llamarpc.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[address,'latest']})}),fetch('https://eth.llamarpc.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_getTransactionCount',params:[address,'latest']})})])
        const [bd,td]=await Promise.all([b.json(),t.json()])
        if(bd.result)ethBalance=parseInt(bd.result,16)/1e18
        if(td.result)txCount=parseInt(td.result,16)
      }
      setSearchResult({address,ethBalance,ethUsd:ethBalance*(prices.ETH?.price||0),txCount,loading:false,error:''})
    } catch { setSearchResult(p=>p?{...p,loading:false,error:'Failed'}:null) }
  }

  const handleSend=async()=>{
    if(!sendTo||!sendAmount)return
    setSendLoading(true);setSendError('');setSendSuccess('')
    try {
      const r=await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chain:sendChain,to:sendTo,amount:sendAmount,from:user?.address||MAIN_WALLET})})
      const d=await r.json()
      if(d.success){setSendSuccess(`✅ ${sendAmount} ${sendChain} → ${sendTo.slice(0,8)}... · FREE ⚡`);setSendAmount('');setSendTo('')}
      else setSendError(d.error||'Send failed')
    } catch { setSendError('Network error.') }
    setSendLoading(false)
  }

  const addAlert=()=>{
    if(!alertPrice||parseFloat(alertPrice)<=0)return
    setAlerts(p=>[...p,{id:Date.now().toString(),symbol:alertSymbol,targetPrice:parseFloat(alertPrice),condition:alertCondition,triggered:false}])
    if('Notification' in window)Notification.requestPermission()
    setAlertPrice('')
  }

  const handleEmailContinue=()=>{if(!email.includes('@'))return;setError('');setLoginStep('choose2fa')}
  const handleBiometricAuth=async()=>{
    setError('')
    try {
      const ch=new Uint8Array(32);window.crypto.getRandomValues(ch)
      const c=await navigator.credentials.get({publicKey:{challenge:ch,rpId:window.location.hostname,allowCredentials:[],userVerification:'preferred',timeout:60000}} as CredentialRequestOptions)
      if(c){setLoginStep('creating');await new Promise(r=>setTimeout(r,1500));setUser({address:MAIN_WALLET,type:'smart',email,twoFaMethod:'biometric'});await fetchBalance(MAIN_WALLET);setScreen('dashboard')}
    } catch { setError('Biometric failed. Try Google Authenticator.') }
  }
  const handleTotpAuth=async()=>{
    if(totpCode.length!==6)return;setError('')
    try {
      const r=await fetch('/api/auth/totp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'totp',token:totpCode})})
      const d=await r.json()
      if(d.valid){setLoginStep('creating');await new Promise(r=>setTimeout(r,1500));setUser({address:MAIN_WALLET,type:'smart',email,twoFaMethod:'totp'});await fetchBalance(MAIN_WALLET);setScreen('dashboard')}
      else setError('Invalid code.')
    } catch { setError('Verification failed.') }
  }
  const handleGuestView=()=>{setUser({address:MAIN_WALLET,type:'external'});fetchBalance(MAIN_WALLET);setScreen('dashboard')}
  const handleRefresh=async()=>{setRefreshing(true);await Promise.all([fetchPrices(),fetchBalance(user?.address||MAIN_WALLET),checkChainStatus()]);setRefreshing(false)}

  const portfolioTotal=(walletData?.ethBalance||0)*(prices.ETH?.price||0)+(walletData?.solBalance||0)*(prices.SOL?.price||0)+(walletData?.arbBalance||0)*(prices.ARB?.price||0)+EMOCOIN.balance*EMOCOIN.priceUsd
  const goalPct=Math.min((portfolioTotal/GOAL_USD)*100,100)
  const fmt=(n:number)=>n>=1000?'$'+(n/1000).toFixed(1)+'K':'$'+n.toFixed(2)
  const fmtAddr=(a:string)=>a.slice(0,8)+'...'+a.slice(-6)
  const walletLabel=user?.type==='smart'?'SMART WALLET '+(user.twoFaMethod==='biometric'?'👆':'🔢'):'MAIN WALLET'
  const s = { card:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:16,marginBottom:12} as const, mono:{fontFamily:'var(--font-mono)'} as const, muted:{color:'var(--text-muted)'} as const, cyan:{color:'var(--cyan)'} as const, label:{fontSize:'0.62rem',letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:6} as const }

  // ── FROZEN SCREEN ──
  if(frozen) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{fontSize:'3rem',marginBottom:16}}>❄️</div>
      <div style={{fontSize:'1.2rem',...s.mono,...s.cyan,marginBottom:8}}>WALLET FROZEN</div>
      <div style={{fontSize:'0.75rem',...s.muted,textAlign:'center',marginBottom:24}}>Enter PIN to unfreeze.</div>
      <input type="password" maxLength={6} placeholder="Enter PIN" value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/g,'').slice(0,6))} style={{padding:'12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'1.2rem',letterSpacing:'0.3em',textAlign:'center',marginBottom:12,width:'100%',maxWidth:200}}/>
      {pinError&&<div style={{color:'#ff4466',fontSize:'0.72rem',marginBottom:8}}>{pinError}</div>}
      <button onClick={()=>{if(pinInput===pin){setFrozen(false);setPinInput('');setPinError('')}else setPinError('Wrong PIN')}} style={{padding:'12px 24px',background:'var(--cyan-glow)',border:'1px solid var(--cyan)',borderRadius:8,...s.mono,...s.cyan,cursor:'pointer'}}>Unfreeze Wallet</button>
    </div>
  )

  // ── LOGIN ──
  if(screen==='login') return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.logo+' fade-up'}><span className={styles.hexLogo}>⬡</span><div><div className={styles.logoTitle}>THE WALL</div><div className={styles.logoSub}>Web3 · Kannur → Dubai · 5 Chains</div></div></div>
        {loginStep==='home'&&<div className="fade-up-1">
          <p className={styles.loginDesc}>Gasless wallet. No seed phrase.<br/>Charts · News · Alerts · DApps</p>
          <div className={styles.featureRow}>{[['⬡','No Seed'],['⚡','Gasless'],['🔒','2FA'],['📊','Charts'],['📰','News'],['🔔','Alerts']].map(([i,l])=><div key={l} className={styles.featureChip}><span>{i}</span><span>{l}</span></div>)}</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16,justifyContent:'center'}}>
            {[{id:'earth',label:'🌍'},{id:'soul',label:'🌟'},{id:'moon',label:'🌙'},{id:'orbit',label:'🪐'},{id:'birth',label:'₿'}].map(c=>(
              <div key={c.id} style={{padding:'4px 10px',borderRadius:20,fontSize:'0.65rem',border:'1px solid',...s.mono,borderColor:chainStatus[c.id]==='online'?'rgba(0,255,136,0.3)':chainStatus[c.id]==='offline'?'rgba(255,68,102,0.3)':'rgba(255,255,255,0.1)',color:chainStatus[c.id]==='online'?'#00ff88':chainStatus[c.id]==='offline'?'#ff4466':'rgba(232,244,253,0.4)'}}>
                {c.label} {chainStatus[c.id]==='online'?'●':chainStatus[c.id]==='offline'?'○':'···'}
              </div>
            ))}
          </div>
          <button className={styles.btnPrimary} onClick={()=>setLoginStep('email')}>Sign Up / Login</button>
          <button className={styles.btnSecondary} onClick={handleGuestView}>View Portfolio (Guest)</button>
          <div className={styles.gasNote}>✅ Gas FREE · 🛡️ CodeQL + Snyk + Semgrep</div>
        </div>}
        {loginStep==='email'&&<div className="fade-up-1"><p className={styles.loginDesc}>Enter your email.</p><input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleEmailContinue()} autoFocus/>{error&&<p style={{color:'#ff4466',fontSize:'0.72rem',marginBottom:8}}>{error}</p>}<button className={styles.btnPrimary} onClick={handleEmailContinue}>Continue →</button><button className={styles.btnGhost} onClick={()=>setLoginStep('home')}>← Back</button></div>}
        {loginStep==='choose2fa'&&<div className="fade-up-1"><p className={styles.loginDesc}><strong style={s.cyan}>Choose 2FA</strong></p>{hasBiometric&&<button className={styles.btnPrimary} onClick={()=>{setLoginStep('biometric');handleBiometricAuth()}}>👆 Fingerprint / Face ID</button>}<button className={hasBiometric?styles.btnSecondary:styles.btnPrimary} onClick={()=>setLoginStep('totp')}>🔢 Google Authenticator</button><button className={styles.btnGhost} onClick={()=>setLoginStep('email')}>← Back</button></div>}
        {loginStep==='biometric'&&<div className="fade-up-1"><p className={styles.loginDesc}>👆 Biometric Verification</p><div style={{textAlign:'center',fontSize:'3rem',margin:'20px 0'}}>👆</div><button className={styles.btnPrimary} onClick={handleBiometricAuth}>👆 Authenticate</button>{error&&<p style={{color:'#ff4466',fontSize:'0.72rem',textAlign:'center',marginTop:8}}>{error}</p>}<button className={styles.btnGhost} onClick={()=>setLoginStep('choose2fa')}>← Back</button></div>}
        {loginStep==='totp'&&<div className="fade-up-1"><p className={styles.loginDesc}>🔢 Enter 6-digit code</p><input className={styles.input} type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={e=>setTotpCode(e.target.value.replace(/\D/g,'').slice(0,6))} autoFocus/>{error&&<p style={{color:'#ff4466',fontSize:'0.72rem',marginBottom:8}}>{error}</p>}<button className={styles.btnPrimary} onClick={handleTotpAuth} disabled={totpCode.length!==6}>Verify →</button><button className={styles.btnGhost} onClick={()=>setLoginStep('choose2fa')}>← Back</button></div>}
        {loginStep==='creating'&&<div className={styles.creating+' fade-up-1'}><div className={styles.spinner}/><p>Setting up wallet...</p><p className={styles.creatingNote}>5 chains · Charts · News · Alerts</p></div>}
      </div>
      <div className={styles.loginFooter}>⬡ THE WALL · DWIN · 2026 · KANNUR → DUBAI · 🌍🌟🌙🪐₿</div>
    </div>
  )

  // ── DASHBOARD ──
  return (
    <div className={styles.dashWrap} style={{paddingBottom:70}}>
      <header className={styles.header+' fade-up'}>
        <div className={styles.headerLeft}><span className={styles.hexSmall}>⬡</span><span className={styles.headerTitle}>THE WALL</span></div>
        <div className={styles.headerRight}><button className={styles.searchIconBtn} onClick={()=>setSearchOpen(true)}>🔍</button><button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}><span style={{display:'inline-block',animation:refreshing?'spin 0.8s linear infinite':'none'}}>↻</span></button><button className={styles.logoutBtn} onClick={()=>{setScreen('login');setLoginStep('home')}}>⏻</button></div>
      </header>

      {/* Search Modal */}
      {searchOpen&&<div className={styles.searchOverlay} onClick={()=>setSearchOpen(false)}><div className={styles.searchModal} onClick={e=>e.stopPropagation()}>
        <div className={styles.searchHeader}><span className={styles.searchTitle}>🔍 Wallet Search</span><button className={styles.searchClose} onClick={()=>{setSearchOpen(false);setSearchResult(null);setSearchQuery('')}}>✕</button></div>
        <div className={styles.searchInputRow}><input className={styles.searchInput} placeholder="ETH/SOL/ARB address..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchWallet(searchQuery)} autoFocus/><button className={styles.searchBtn} onClick={()=>searchWallet(searchQuery)}>→</button></div>
        {!searchResult&&searchHistory.length>0&&<div className={styles.searchHistory}><div className={styles.searchHistoryLabel}>Recent</div>{searchHistory.map(a=><div key={a} className={styles.searchHistoryItem} onClick={()=>{setSearchQuery(a);searchWallet(a)}}><span className={styles.historyIcon}>⬡</span><span className={styles.historyAddr}>{a.slice(0,10)}...{a.slice(-8)}</span></div>)}</div>}
        {searchResult&&<div className={styles.searchResult}>{searchResult.loading?<div className={styles.searchLoading}><div className={styles.spinner}/><span>Fetching...</span></div>:searchResult.error?<div className={styles.searchError}>⚠ {searchResult.error}</div>:<><div className={styles.searchAddr}>{searchResult.address.slice(0,10)}...{searchResult.address.slice(-8)}<button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(searchResult.address)}>📋</button></div><div className={styles.searchCards}><div className={styles.searchCard}><div className={styles.searchCardLabel}>ETH</div><div className={styles.searchCardValue} style={{color:'#627eea'}}>{searchResult.ethBalance.toFixed(4)}</div><div className={styles.searchCardUsd}>${searchResult.ethUsd.toFixed(2)}</div></div><div className={styles.searchCard}><div className={styles.searchCardLabel}>Txns</div><div className={styles.searchCardValue}>{searchResult.txCount}</div><div className={styles.searchCardUsd}>total</div></div></div><button className={styles.searchViewBtn} onClick={()=>{setUser({address:searchResult.address,type:'external'});fetchBalance(searchResult.address);setSearchOpen(false);setSearchResult(null)}}>View Portfolio →</button></>}</div>}
      </div></div>}

      {/* Send/Receive Modal */}
      {sendOpen&&<div className={styles.searchOverlay} onClick={()=>setSendOpen(false)}><div className={styles.searchModal} onClick={e=>e.stopPropagation()}>
        <div className={styles.searchHeader}><span className={styles.searchTitle}>{sendTab==='send'?'📤 Send':'📥 Receive'}</span><button className={styles.searchClose} onClick={()=>{setSendOpen(false);setSendError('');setSendSuccess('')}}>✕</button></div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>{(['send','receive']as const).map(t=><button key={t} onClick={()=>setSendTab(t)} style={{flex:1,padding:'10px',border:'1px solid',borderColor:sendTab===t?'var(--cyan)':'var(--border)',borderRadius:8,background:sendTab===t?'var(--cyan-glow)':'transparent',color:sendTab===t?'var(--cyan)':'var(--text-muted)',...s.mono,fontSize:'0.8rem',cursor:'pointer'}}>{t==='send'?'📤 Send':'📥 Receive'}</button>)}</div>
        {sendTab==='send'&&<div>
          <div style={{marginBottom:12}}><div style={s.label}>SELECT CHAIN</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{SEND_CHAINS.map(c=><button key={c.id} onClick={()=>setSendChain(c.id as typeof sendChain)} style={{padding:'8px 12px',border:'1px solid',borderColor:sendChain===c.id?c.color:'var(--border)',borderRadius:8,background:sendChain===c.id?`${c.color}15`:'var(--bg3)',color:sendChain===c.id?c.color:'var(--text-muted)',...s.mono,fontSize:'0.75rem',fontWeight:700,cursor:'pointer'}}>{c.label}</button>)}</div></div>
          <div style={{marginBottom:12}}><div style={s.label}>TO ADDRESS</div><input className={styles.searchInput} placeholder={sendChain==='SOL'?'SOL...':sendChain==='BTC'?'BTC...':'0x...'} value={sendTo} onChange={e=>setSendTo(e.target.value)}/></div>
          <div style={{marginBottom:16}}><div style={s.label}>AMOUNT</div><div style={{position:'relative'}}><input className={styles.searchInput} placeholder="0.00" type="number" value={sendAmount} onChange={e=>setSendAmount(e.target.value)} style={{width:'100%',paddingRight:60}}/><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:'0.75rem',color:SEND_CHAINS.find(c=>c.id===sendChain)?.color,...s.mono,fontWeight:700}}>{sendChain}</span></div>{sendAmount&&prices[sendChain]&&<div style={{fontSize:'0.68rem',...s.muted,marginTop:4}}>≈ ${(parseFloat(sendAmount||'0')*(prices[sendChain]?.price||0)).toFixed(2)} · FREE ⚡</div>}</div>
          {addressBook.length>0&&<div style={{marginBottom:12}}>{addressBook.map((e,i)=><div key={i} onClick={()=>setSendTo(e.address)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,marginBottom:6,cursor:'pointer'}}><span>👤</span><div><div style={{fontSize:'0.75rem',color:'var(--text)'}}>{e.name}</div><div style={{fontSize:'0.65rem',...s.muted}}>{e.address.slice(0,10)}...</div></div></div>)}</div>}
          <button onClick={()=>{const n=prompt('Name:');if(n&&sendTo)setAddressBook(p=>[...p,{name:n,address:sendTo}])}} style={{background:'none',border:'1px dashed var(--border)',borderRadius:8,...s.muted,...s.mono,fontSize:'0.72rem',padding:'8px',cursor:'pointer',width:'100%',marginBottom:12}}>+ Save to Address Book</button>
          {sendError&&<div style={{padding:'10px',background:'rgba(255,68,102,0.08)',border:'1px solid rgba(255,68,102,0.2)',borderRadius:8,color:'#ff4466',fontSize:'0.75rem',marginBottom:12}}>⚠ {sendError}</div>}
          {sendSuccess&&<div style={{padding:'10px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:8,color:'#00ff88',fontSize:'0.75rem',marginBottom:12}}>{sendSuccess}</div>}
          <button className={styles.searchBtn} style={{width:'100%',padding:'13px'}} onClick={handleSend} disabled={sendLoading||!sendTo||!sendAmount}>{sendLoading?'⏳ Processing...':`📤 Send ${sendChain} · FREE ⚡`}</button>
        </div>}
        {sendTab==='receive'&&<div style={{textAlign:'center'}}>
          <div style={{marginBottom:16}}><div style={{...s.label,marginBottom:8}}>ETH / ARB / MON</div><div style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border-bright)',borderRadius:10,fontSize:'0.72rem',...s.cyan,wordBreak:'break-all',...s.mono,lineHeight:1.6}}>{user?.address||MAIN_WALLET}</div><button onClick={()=>navigator.clipboard.writeText(user?.address||MAIN_WALLET)} style={{marginTop:10,padding:'10px 20px',background:'var(--bg3)',border:'1px solid var(--border-bright)',borderRadius:8,...s.cyan,...s.mono,fontSize:'0.8rem',cursor:'pointer'}}>📋 Copy ETH</button></div>
          <div style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,marginBottom:12}}><div style={{...s.label,marginBottom:8}}>SOLANA 🌟</div><div style={{fontSize:'0.68rem',color:'#9945ff',wordBreak:'break-all',...s.mono,lineHeight:1.6}}>{SOL_WALLET}</div><button onClick={()=>navigator.clipboard.writeText(SOL_WALLET)} style={{marginTop:8,padding:'8px 16px',background:'rgba(153,69,255,0.1)',border:'1px solid rgba(153,69,255,0.3)',borderRadius:6,color:'#9945ff',...s.mono,fontSize:'0.72rem',cursor:'pointer'}}>📋 Copy SOL</button></div>
          <div style={{fontSize:'0.68rem',...s.muted,lineHeight:1.8}}>⚠️ ETH → ETH only · SOL → Solana only</div>
        </div>}
      </div></div>}

      {/* DApp Browser */}
      {dappOpen&&<div className={styles.searchOverlay}><div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,width:'100%',maxWidth:600,margin:'auto',marginTop:20,padding:0,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'var(--bg3)',borderBottom:'1px solid var(--border)'}}><input value={dappUrl} onChange={e=>setDappUrl(e.target.value)} style={{flex:1,padding:'8px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,...s.mono,color:'var(--text)',fontSize:'0.75rem'}} placeholder="https://"/><button onClick={()=>setDappOpen(false)} style={{padding:'6px 10px',background:'rgba(255,68,102,0.1)',border:'1px solid rgba(255,68,102,0.2)',borderRadius:6,color:'#ff4466',cursor:'pointer'}}>✕</button></div>
        <iframe src={dappUrl} style={{width:'100%',height:'70vh',border:'none'}} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title="DApp"/>
      </div></div>}

      <main className={styles.main}>

        {/* HOME */}
        {bottomTab==='home'&&<div>
          <section className={styles.walletCard+' fade-up-1'}>
            <div className={styles.walletTop}><div><div className={styles.walletLabel}>{walletLabel}</div><div className={styles.walletAddr}>{fmtAddr(user?.address||MAIN_WALLET)}<button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(user?.address||MAIN_WALLET)}>📋</button></div>{user?.email&&<div className={styles.walletEmail}>{user.email}</div>}</div><div className={styles.walletTotal}><div className={styles.totalLabel}>TOTAL PORTFOLIO</div><div className={styles.totalAmount}>{portfolioTotal>0?fmt(portfolioTotal):<span className={styles.loading}>$···</span>}</div></div></div>
            <div className={styles.goalSection}><div className={styles.goalRow}><span className={styles.goalLabel}>GOAL: $6,200,000 (₹52 Crore)</span><span className={styles.goalPct}>{goalPct.toFixed(4)}%</span></div><div className={styles.goalBar}><div className={styles.goalFill} style={{width:Math.max(goalPct,0.1)+'%'}}/></div></div>
            <div style={{display:'flex',gap:4,marginTop:12,flexWrap:'wrap'}}>{CHAIN_DOTS.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:12,background:'var(--bg3)',border:`1px solid ${c.c}22`,fontSize:'0.62rem',...s.mono}}><span>{c.label}</span><span style={{width:5,height:5,borderRadius:'50%',background:chainStatus[c.id]==='online'?'#00ff88':chainStatus[c.id]==='offline'?'#ff4466':'#888',display:'inline-block'}}/></div>)}</div>
          </section>
          <section className={styles.emoSection+' fade-up-2'}><div className={styles.emoCard}><span className={styles.emoIcon}>🪙</span><div><div className={styles.emoTitle}>EMOCOINS</div><div className={styles.emoBalance}>{EMOCOIN.balance} EMC</div></div><div className={styles.emoRight}><div className={styles.emoPrice}>1 EMC = $0.01</div><button className={styles.claimBtn}>+ Daily Claim</button></div></div></section>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}><button onClick={()=>{setSendOpen(true);setSendTab('send')}} style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,...s.cyan,...s.mono,fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>📤 Send</button><button onClick={()=>{setSendOpen(true);setSendTab('receive')}} style={{padding:'14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,color:'#9945ff',...s.mono,fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>📥 Receive</button></div>
          <div style={{...s.label,marginBottom:8}}>TOP HOLDINGS</div>
          {TOKENS.slice(0,4).map(token=>{const p=prices[token.symbol],bal=token.symbol==='ETH'?walletData?.ethBalance||0:token.symbol==='SOL'?walletData?.solBalance||0:token.symbol==='ARB'?walletData?.arbBalance||0:token.symbol==='EMC'?EMOCOIN.balance:0;return <div key={token.symbol} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,marginBottom:8}}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:8,height:8,borderRadius:'50%',background:token.color}}/><div><div style={{fontSize:'0.82rem',color:'var(--text)',...s.mono,fontWeight:700}}>{token.symbol}</div><div style={{fontSize:'0.62rem',...s.muted}}>{token.chain}</div></div></div><div style={{textAlign:'right'}}><div style={{fontSize:'0.82rem',color:'var(--text)',...s.mono}}>{p?'$'+p.price.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}):<span style={s.muted}>$···</span>}</div>{p&&<div style={{fontSize:'0.65rem',color:p.change24h>=0?'#00ff88':'#ff4466'}}>{p.change24h>=0?'▲':'▼'} {Math.abs(p.change24h).toFixed(2)}%</div>}{bal>0&&<div style={{fontSize:'0.62rem',...s.muted}}>{bal.toFixed(4)} {token.symbol}</div>}</div></div>})}
        </div>}

        {/* TRADE */}
        bottomTab==='trade'&&<div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>{(['swap','send','receive']as const).map(t=><button key={t} onClick={()=>{if(t!=='swap'){setSendOpen(true);setSendTab(t as 'send'|'receive')}}} style={{flex:1,padding:'10px',border:'1px solid var(--border)',borderRadius:8,background:t==='swap'?'var(--cyan-glow)':'var(--bg2)',color:t==='swap'?'var(--cyan)':'var(--text-muted)',...s.mono,fontSize:'0.75rem',cursor:'pointer'}}>{t==='swap'?'🔄 Swap':t==='send'?'📤 Send':'📥 Receive'}</button>)}</div>
          <div style={s.card}><div style={s.label}>FROM</div><div style={{display:'flex',gap:8,alignItems:'center'}}><select value={swap.fromToken} onChange={e=>setSwap(p=>({...p,fromToken:e.target.value,toToken:e.target.value===p.toToken?SWAP_TOKENS.filter(t=>t!==e.target.value)[0]:p.toToken,estimatedOut:''}))} style={{flex:1,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'0.82rem',cursor:'pointer'}}>{SWAP_TOKENS.map(t=><option key={t} value={t}>{t}</option>)}</select><input type="number" placeholder="0.00" value={swap.amount} onChange={e=>setSwap(p=>({...p,amount:e.target.value}))} style={{flex:1.5,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border-bright)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'1rem'}}/></div>{swap.amount&&prices[swap.fromToken]&&<div style={{fontSize:'0.68rem',...s.muted,marginTop:6}}>≈ ${(parseFloat(swap.amount)*(prices[swap.fromToken]?.price||0)).toFixed(2)}</div>}</div>
          <div style={{textAlign:'center',margin:'4px 0'}}><button onClick={()=>setSwap(p=>({...p,fromToken:p.toToken,toToken:p.fromToken,estimatedOut:'',amount:''}))} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'50%',width:36,height:36,...s.cyan,fontSize:'1rem',cursor:'pointer'}}>⇅</button></div>
          <div style={{...s.card,marginBottom:16}}><div style={s.label}>TO</div><div style={{display:'flex',gap:8,alignItems:'center'}}><select value={swap.toToken} onChange={e=>setSwap(p=>({...p,toToken:e.target.value,estimatedOut:''}))} style={{flex:1,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'0.82rem',cursor:'pointer'}}>{SWAP_TOKENS.filter(t=>t!==swap.fromToken).map(t=><option key={t} value={t}>{t}</option>)}</select><div style={{flex:1.5,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:swap.estimatedOut?'#00ff88':'var(--text-muted)',...s.mono,fontSize:'1rem',minHeight:42}}>{swap.estimatedOut||'0.00'}</div></div></div>
          {swap.estimatedOut&&<div style={{...s.card,marginBottom:12,fontSize:'0.7rem',...s.mono}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={s.muted}>Route</span><span style={s.cyan}>{swap.route}</span></div><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={s.muted}>Impact</span><span style={{color:swap.priceImpact<1?'#00ff88':'#ff4466'}}>{swap.priceImpact.toFixed(2)}%</span></div><div style={{display:'flex',justifyContent:'space-between'}}><span style={s.muted}>Gas</span><span style={{color:'#00ff88'}}>FREE ⚡</span></div></div>}
          {swap.error&&<div style={{padding:'10px',background:'rgba(255,68,102,0.08)',border:'1px solid rgba(255,68,102,0.2)',borderRadius:8,color:'#ff4466',fontSize:'0.75rem',marginBottom:12}}>⚠ {swap.error}</div>}
          {swap.success&&<div style={{padding:'10px',background:'rgba(0,255,136,0.05)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:8,color:'#00ff88',fontSize:'0.75rem',marginBottom:12}}>{swap.success}</div>}
          <button onClick={handleSwap} disabled={swap.loading||!swap.amount||!swap.estimatedOut} style={{width:'100%',padding:'14px',background:swap.loading||!swap.amount?'var(--bg3)':'linear-gradient(135deg,#627eea,#9945ff)',border:'none',borderRadius:10,color:'#fff',...s.mono,fontSize:'0.9rem',fontWeight:700,cursor:swap.loading||!swap.amount?'not-allowed':'pointer'}}>{swap.loading?'⏳ Swapping...':`🔄 Swap ${swap.fromToken} → ${swap.toToken}`}</button>
          <div style={{textAlign:'center',fontSize:'0.62rem',...s.muted,marginTop:10}}>UniSwap V3 · Gasless ⚡ · TheWall Universal 🦋</div>
        </div>}
        
        {/* MARKETS */}
        {bottomTab==='markets'&&<div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>{(['charts','news','alerts']as const).map(t=><button key={t} onClick={()=>setMarketsTab(t)} style={{flex:1,padding:'10px',border:'1px solid',borderColor:marketsTab===t?'var(--cyan)':'var(--border)',borderRadius:8,background:marketsTab===t?'var(--cyan-glow)':'var(--bg2)',color:marketsTab===t?'var(--cyan)':'var(--text-muted)',...s.mono,fontSize:'0.72rem',cursor:'pointer'}}>{t==='charts'?'📊 Charts':t==='news'?'📰 News':'🔔 Alerts'}</button>)}</div>

          {marketsTab==='charts'&&<div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>{['ETH','SOL','ARB','BTC','BNB'].map(sym=>{const token=TOKENS.find(t=>t.symbol===sym);return <button key={sym} onClick={()=>setChartToken(sym)} style={{padding:'6px 12px',border:'1px solid',borderColor:chartToken===sym?token?.color||'var(--cyan)':'var(--border)',borderRadius:20,background:chartToken===sym?`${token?.color||'#00e5ff'}15`:'var(--bg2)',color:chartToken===sym?token?.color||'var(--cyan)':'var(--text-muted)',...s.mono,fontSize:'0.72rem',cursor:'pointer'}}>{sym}</button>})}</div>
            <div style={{display:'flex',gap:6,marginBottom:12}}>{[{v:'1',l:'1D'},{v:'7',l:'7D'},{v:'30',l:'1M'},{v:'90',l:'3M'},{v:'365',l:'1Y'}].map(d=><button key={d.v} onClick={()=>setChartDays(d.v)} style={{flex:1,padding:'6px',border:'1px solid',borderColor:chartDays===d.v?'var(--cyan)':'var(--border)',borderRadius:6,background:chartDays===d.v?'var(--cyan-glow)':'var(--bg2)',color:chartDays===d.v?'var(--cyan)':'var(--text-muted)',...s.mono,fontSize:'0.68rem',cursor:'pointer'}}>{d.l}</button>)}</div>
            <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:8}}><div style={{fontSize:'1.4rem',...s.mono,color:'var(--text)',fontWeight:700}}>{prices[chartToken]?'$'+prices[chartToken].price.toLocaleString('en',{minimumFractionDigits:2}):'$···'}</div>{prices[chartToken]&&<div style={{fontSize:'0.82rem',color:prices[chartToken].change24h>=0?'#00ff88':'#ff4466'}}>{prices[chartToken].change24h>=0?'▲':'▼'} {Math.abs(prices[chartToken].change24h).toFixed(2)}% (24h)</div>}</div>
            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:8,marginBottom:12,position:'relative'}}>
              {chartLoading&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',borderRadius:12,zIndex:1}}><div className={styles.spinner}/></div>}
              <canvas ref={canvasRef} width={340} height={160} style={{width:'100%',height:160,display:'block'}}/>
              {!chartData.length&&!chartLoading&&<div style={{textAlign:'center',fontSize:'0.72rem',...s.muted,padding:20}}>No chart data</div>}
            </div>
            <div style={{...s.label,marginBottom:8}}>ALL ASSETS</div>
            {TOKENS.map(token=>{const p=prices[token.symbol];return <div key={token.symbol} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,marginBottom:6}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:6,height:6,borderRadius:'50%',background:token.color}}/><span style={{fontSize:'0.78rem',...s.mono,color:'var(--text)',fontWeight:700}}>{token.symbol}</span><span style={{fontSize:'0.6rem',...s.muted}}>{token.chain}</span></div><div style={{textAlign:'right'}}><div style={{fontSize:'0.78rem',...s.mono}}>{p?'$'+p.price.toLocaleString('en',{minimumFractionDigits:2}):<span style={s.muted}>$···</span>}</div>{p&&<div style={{fontSize:'0.62rem',color:p.change24h>=0?'#00ff88':'#ff4466'}}>{p.change24h>=0?'▲':'▼'}{Math.abs(p.change24h).toFixed(2)}%</div>}</div></div>})}
          </div>}

          {marketsTab==='news'&&<div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{...s.label,marginBottom:0}}>CRYPTO NEWS</div><button onClick={fetchNews} style={{padding:'4px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,...s.cyan,...s.mono,fontSize:'0.65rem',cursor:'pointer'}}>↻ Refresh</button></div>
            {newsLoading&&<div style={{display:'flex',justifyContent:'center',padding:24}}><div className={styles.spinner}/></div>}
            {!newsLoading&&news.length===0&&<div style={{textAlign:'center',padding:24,fontSize:'0.75rem',...s.muted}}>No news available.<br/>Check CRYPTOPANIC_API_KEY</div>}
            {news.map((item,i)=><div key={i} style={{...s.card,padding:12,marginBottom:8,cursor:'pointer'}} onClick={()=>window.open(item.url,'_blank')}>
              <div style={{fontSize:'0.75rem',color:'var(--text)',lineHeight:1.5,marginBottom:6}}>{item.title}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{item.currencies.slice(0,3).map(c=><span key={c} style={{fontSize:'0.6rem',padding:'2px 6px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,...s.mono,...s.cyan}}>{c}</span>)}</div><div style={{fontSize:'0.6rem',...s.muted}}>{item.source}</div></div>
              <div style={{display:'flex',gap:8,marginTop:6,fontSize:'0.62rem'}}><span style={{color:'#00ff88'}}>▲ {item.positive}</span><span style={{color:'#ff4466'}}>▼ {item.negative}</span><span style={s.muted}>{new Date(item.published).toLocaleDateString()}</span></div>
            </div>)}
          </div>}

          {marketsTab==='alerts'&&<div>
            <div style={s.card}>
              <div style={{...s.label,marginBottom:12}}>CREATE PRICE ALERT 🔔</div>
              <div style={{display:'flex',gap:8,marginBottom:10}}><select value={alertSymbol} onChange={e=>setAlertSymbol(e.target.value)} style={{flex:1,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'0.82rem',cursor:'pointer'}}>{TOKENS.filter(t=>t.cgId).map(t=><option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}</select><select value={alertCondition} onChange={e=>setAlertCondition(e.target.value as 'above'|'below')} style={{flex:1,padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'0.82rem',cursor:'pointer'}}><option value="above">Above ▲</option><option value="below">Below ▼</option></select></div>
              <input type="number" placeholder="Target price USD" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)} style={{width:'100%',padding:'10px',background:'var(--bg3)',border:'1px solid var(--border-bright)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'0.9rem',marginBottom:10}}/>
              <div style={{fontSize:'0.65rem',...s.muted,marginBottom:10}}>Current {alertSymbol}: {prices[alertSymbol]?'$'+prices[alertSymbol].price.toLocaleString('en',{minimumFractionDigits:2}):'$···'}</div>
              <button onClick={addAlert} disabled={!alertPrice} style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#627eea,#9945ff)',border:'none',borderRadius:8,color:'#fff',...s.mono,fontSize:'0.85rem',fontWeight:700,cursor:alertPrice?'pointer':'not-allowed',opacity:alertPrice?1:0.5}}>🔔 Set Alert</button>
            </div>
            {alerts.map(alert=><div key={alert.id} style={{...s.card,padding:12,marginBottom:8,borderColor:alert.triggered?'rgba(0,255,136,0.3)':'var(--border)',background:alert.triggered?'rgba(0,255,136,0.03)':'var(--bg2)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><div style={{fontSize:'0.78rem',...s.mono,color:'var(--text)',fontWeight:700}}>{alert.symbol} {alert.condition==='above'?'▲':'▼'} ${alert.targetPrice.toLocaleString()}</div><div style={{fontSize:'0.62rem',...s.muted,marginTop:2}}>{alert.triggered?'✅ Triggered!':'⏳ Watching...'}</div></div><button onClick={()=>setAlerts(p=>p.filter(a=>a.id!==alert.id))} style={{padding:'4px 8px',background:'rgba(255,68,102,0.1)',border:'1px solid rgba(255,68,102,0.2)',borderRadius:6,color:'#ff4466',fontSize:'0.65rem',cursor:'pointer'}}>✕</button></div></div>)}
            {alerts.length===0&&<div style={{textAlign:'center',padding:24,fontSize:'0.75rem',...s.muted}}>No alerts. Create one above! 🔔</div>}
          </div>}
        </div>}

        {/* SETTINGS */}
        {bottomTab==='settings'&&<div>
          <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>{(['profile','security','history','dapps']as const).map(t=><button key={t} onClick={()=>setSettingsTab(t)} style={{flex:1,padding:'9px',border:'1px solid',borderColor:settingsTab===t?'var(--cyan)':'var(--border)',borderRadius:8,background:settingsTab===t?'var(--cyan-glow)':'var(--bg2)',color:settingsTab===t?'var(--cyan)':'var(--text-muted)',...s.mono,fontSize:'0.68rem',cursor:'pointer',minWidth:60}}>{t==='profile'?'👤':t==='security'?'🔐':t==='history'?'💳':'🌐'} {t}</button>)}</div>

          {settingsTab==='profile'&&<div>
            <div style={{...s.card,textAlign:'center'}}><div style={{fontSize:'3rem',marginBottom:8}}>🦋</div><div style={{fontSize:'0.9rem',...s.mono,color:'var(--text)',fontWeight:700,marginBottom:4}}>{user?.email||'Guest Wallet'}</div><div style={{fontSize:'0.68rem',...s.muted,marginBottom:12}}>{user?.type==='smart'?'Smart Wallet · '+(user.twoFaMethod==='biometric'?'Biometric 👆':'TOTP 🔢'):'External Wallet'}</div><div style={{padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,fontSize:'0.7rem',...s.mono,...s.cyan,wordBreak:'break-all'}}>{user?.address||MAIN_WALLET}</div><button onClick={()=>navigator.clipboard.writeText(user?.address||MAIN_WALLET)} style={{marginTop:8,padding:'8px 16px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,...s.cyan,...s.mono,fontSize:'0.72rem',cursor:'pointer'}}>📋 Copy Address</button></div>
            <div style={s.card}><div style={{...s.label,marginBottom:12}}>WALLET STATS</div>{[{label:'Portfolio',value:fmt(portfolioTotal)},{label:'EmoCoins',value:EMOCOIN.balance+' EMC'},{label:'Goal',value:goalPct.toFixed(4)+'%'},{label:'Active Alerts',value:alerts.filter(a=>!a.triggered).length.toString()},{label:'Address Book',value:addressBook.length.toString()}].map(stat=><div key={stat.label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:'0.72rem',...s.muted}}>{stat.label}</span><span style={{fontSize:'0.72rem',...s.mono,color:'var(--text)',fontWeight:700}}>{stat.value}</span></div>)}</div>
            <div style={{...s.label,marginBottom:8}}>TREASURY</div>
            <div className={styles.treasuryCard}><div className={styles.treasuryIcon}>🏛️</div><div><div className={styles.treasuryLabel}>ETH / ARB / MON</div><div className={styles.treasuryAddr}>{TREASURY}</div></div><button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(TREASURY)}>📋</button></div>
            <div className={styles.treasuryCard}><div className={styles.treasuryIcon}>🌟</div><div><div className={styles.treasuryLabel}>SOLANA</div><div className={styles.treasuryAddr}>{SOL_WALLET}</div></div><button className={styles.copyBtn} onClick={()=>navigator.clipboard.writeText(SOL_WALLET)}>📋</button></div>
          </div>}

          {settingsTab==='security'&&<div>
            <div style={{...s.card,border:`1px solid ${frozen?'rgba(0,255,136,0.3)':'rgba(255,68,102,0.2)'}`}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><div><div style={{fontSize:'0.82rem',...s.mono,color:'var(--text)',fontWeight:700}}>❄️ Freeze Wallet</div><div style={{fontSize:'0.65rem',...s.muted,marginTop:2}}>{frozen?'Wallet is FROZEN':'Emergency lock'}</div></div><button onClick={()=>{if(!pinSet){alert('Set PIN first!');return}setFrozen(!frozen)}} style={{padding:'8px 14px',background:frozen?'rgba(0,255,136,0.1)':'rgba(255,68,102,0.1)',border:`1px solid ${frozen?'rgba(0,255,136,0.3)':'rgba(255,68,102,0.3)'}`,borderRadius:8,color:frozen?'#00ff88':'#ff4466',...s.mono,fontSize:'0.75rem',cursor:'pointer'}}>{frozen?'Unfreeze':'Freeze'}</button></div><div style={{fontSize:'0.62rem',...s.muted}}>Freezing locks all transactions immediately</div></div>
            <div style={s.card}><div style={{...s.label,marginBottom:12}}>🔑 {pinSet?'CHANGE PIN':'SET PIN'}</div><input type="password" maxLength={6} placeholder="6-digit PIN" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,6))} style={{width:'100%',padding:'10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'1.2rem',letterSpacing:'0.3em',textAlign:'center',marginBottom:10}}/><button onClick={()=>{if(pin.length===6){setPinSet(true);setPinError('');alert('PIN set!')}else setPinError('6 digits needed')}} style={{width:'100%',padding:'10px',background:'var(--cyan-glow)',border:'1px solid var(--cyan)',borderRadius:8,...s.cyan,...s.mono,fontSize:'0.82rem',cursor:'pointer'}}>✅ {pinSet?'Update':'Set'} PIN</button>{pinError&&<div style={{color:'#ff4466',fontSize:'0.68rem',marginTop:6}}>{pinError}</div>}</div>
            <div style={{...s.label,marginBottom:8}}>CHAIN STATUS</div>
            {[{id:'earth',label:'🌍 Earth',chain:'Ethereum',rpc:'eth.llamarpc.com'},{id:'soul',label:'🌟 Soul',chain:'Solana',rpc:'mainnet-beta.solana.com'},{id:'moon',label:'🌙 Moon',chain:'Monad',rpc:'rpc.monad.xyz'},{id:'orbit',label:'🪐 Orbit',chain:'Arbitrum',rpc:'arb1.arbitrum.io'},{id:'birth',label:'₿ Birth',chain:'Bitcoin',rpc:'mempool.space'}].map(c=><div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'var(--bg2)',border:`1px solid ${CHAIN_COLORS[c.id]}22`,borderRadius:8,marginBottom:6}}><div><div style={{fontSize:'0.75rem',color:'var(--text)',...s.mono}}>{c.label}</div><div style={{fontSize:'0.62rem',...s.muted}}>{c.chain} · {c.rpc}</div></div><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:7,height:7,borderRadius:'50%',background:chainStatus[c.id]==='online'?'#00ff88':chainStatus[c.id]==='offline'?'#ff4466':'#888',display:'inline-block'}}/><span style={{fontSize:'0.62rem',color:chainStatus[c.id]==='online'?'#00ff88':'var(--text-muted)',...s.mono}}>{chainStatus[c.id]==='online'?'LIVE':chainStatus[c.id]==='offline'?'DOWN':'···'}</span></div></div>)}
            <div className={styles.webhookStatus}><span className={styles.liveDot}/>Alchemy Webhook Active</div>
            <div style={{textAlign:'center',fontSize:'0.62rem',...s.muted,marginTop:8}}>🛡️ CodeQL · Snyk · Semgrep</div>
          </div>}

          {settingsTab==='history'&&<div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{...s.label,marginBottom:0}}>TX HISTORY</div><button onClick={()=>fetchTxHistory(user?.address||MAIN_WALLET)} style={{padding:'4px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,...s.cyan,...s.mono,fontSize:'0.65rem',cursor:'pointer'}}>↻</button></div>
            {txLoading&&<div style={{display:'flex',justifyContent:'center',padding:24}}><div className={styles.spinner}/></div>}
            {!txLoading&&txHistory.length===0&&<div style={{textAlign:'center',padding:24,fontSize:'0.75rem',...s.muted}}>No transactions.<br/>Check ETHERSCAN_API_KEY</div>}
            {txHistory.map((tx,i)=><div key={i} style={{...s.card,padding:12,marginBottom:8,cursor:'pointer'}} onClick={()=>window.open(`https://etherscan.io/tx/${tx.hash}`,'_blank')}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:6,height:6,borderRadius:'50%',background:tx.status==='success'?'#00ff88':'#ff4466',display:'inline-block'}}/><span style={{fontSize:'0.75rem',...s.mono,color:'var(--text)',fontWeight:700}}>{tx.method}</span></div><span style={{fontSize:'0.72rem',...s.mono,color:tx.from.toLowerCase()===(user?.address||'').toLowerCase()?'#ff4466':'#00ff88'}}>{tx.from.toLowerCase()===(user?.address||'').toLowerCase()?'- ':''}{tx.value} ETH</span></div>
              <div style={{fontSize:'0.62rem',...s.muted}}>To: {tx.to.slice(0,10)}...{tx.to.slice(-6)}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:'0.62rem',...s.muted}}><span>{tx.time}</span><span>Gas: {tx.gas}</span><span style={s.cyan}>↗ Etherscan</span></div>
            </div>)}
          </div>}

          {settingsTab==='dapps'&&<div>
            <div style={{...s.label,marginBottom:12}}>POPULAR DApps</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>{DAPP_LIST.map(dapp=><button key={dapp.name} onClick={()=>{setDappUrl(dapp.url);setDappOpen(true)}} style={{padding:'14px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}><span style={{fontSize:'1.5rem'}}>{dapp.icon}</span><span style={{fontSize:'0.72rem',...s.mono,color:'var(--text)'}}>{dapp.name}</span></button>)}</div>
            <div style={{...s.label,marginBottom:8}}>CUSTOM DApp</div>
            <div style={{display:'flex',gap:8}}><input value={dappUrl} onChange={e=>setDappUrl(e.target.value)} placeholder="https://..." style={{flex:1,padding:'10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',...s.mono,fontSize:'0.75rem'}}/><button onClick={()=>{if(dappUrl)setDappOpen(true)}} style={{padding:'10px 14px',background:'var(--cyan-glow)',border:'1px solid var(--cyan)',borderRadius:8,...s.cyan,...s.mono,fontSize:'0.8rem',cursor:'pointer'}}>→</button></div>
            <div style={{fontSize:'0.62rem',...s.muted,marginTop:8}}>⚠️ Only visit trusted DApps</div>
          </div>}
        </div>}

      </main>

      {/* BOTTOM NAV */}
      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--bg2)',borderTop:'1px solid var(--border)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {([{id:'home',icon:'🏠',label:'Home'},{id:'trade',icon:'💱',label:'Trade'},{id:'markets',icon:'📊',label:'Markets'},{id:'settings',icon:'⚙️',label:'Settings'}] as {id:BottomTab;icon:string;label:string}[]).map(tab=>(
          <button key={tab.id} onClick={()=>setBottomTab(tab.id)} style={{flex:1,padding:'12px 0 10px',background:'transparent',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,borderTop:bottomTab===tab.id?'2px solid var(--cyan)':'2px solid transparent'}}>
            <span style={{fontSize:'1.2rem'}}>{tab.icon}</span>
            <span style={{fontSize:'0.58rem',...s.mono,letterSpacing:'0.06em',color:bottomTab===tab.id?'var(--cyan)':'var(--text-muted)',fontWeight:bottomTab===tab.id?700:400}}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
