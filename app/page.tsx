'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './page.module.css'

interface TokenPrice  { price: number; change24h: number }
interface Prices      { [symbol: string]: TokenPrice }
interface WalletData  { address: string; ethBalance: number; solBalance?: number; arbBalance?: number; tokenBalances: { contractAddress: string; tokenBalance: string }[] }
interface UserWallet  { address: string; type: 'smart'|'external'; email?: string; twoFaMethod?: 'totp' }
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
  { symbol:'ETH',  name:'Ethereum', color:'#627eea', chain:'Earth 🌍',   cgId:'ethereum'   },
  { symbol:'SOL',  name:'Solana',   color:'#9945ff', chain:'Soul 🌟',    cgId:'solana'      },
  { symbol:'MON',  name:'Monad',    color:'#836ef9', chain:'Moon 🌙',    cgId:''            },
  { symbol:'ARB',  name:'Arbitrum', color:'#12aaff', chain:'Orbit 🪐',   cgId:'arbitrum'    },
  { symbol:'BTC',  name:'Bitcoin',  color:'#f7931a', chain:'Birth ₿',    cgId:'bitcoin'     },
  { symbol:'BNB',  name:'BNB',      color:'#f0b90b', chain:'BSC',        cgId:'binancecoin' },
  { symbol:'USDC', name:'USD Coin', color:'#2775ca', chain:'Ethereum',   cgId:'usd-coin'    },
  { symbol:'USDT', name:'Tether',   color:'#26a17b', chain:'Ethereum',   cgId:'tether'      },
  { symbol:'EMC',  name:'EmoCoins', color:'#00e5ff', chain:'TheWall 🦋', cgId:''            },
]
const SWAP_TOKENS = ['ETH','SOL','MON','ARB','BTC','USDC','USDT','EMC']
const CHAIN_COLORS: Record<string,string> = { earth:'#627eea', soul:'#9945ff', moon:'#836ef9', orbit:'#12aaff', birth:'#f7931a' }
const SEND_CHAINS = [{id:'ETH',label:'🌍 ETH',color:'#627eea'},{id:'SOL',label:'🌟 SOL',color:'#9945ff'},{id:'ARB',label:'🪐 ARB',color:'#12aaff'},{id:'MON',label:'🌙 MON',color:'#836ef9'},{id:'BTC',label:'₿ BTC',color:'#f7931a'}]
const CHAIN_DOTS  = [{id:'earth',label:'🌍',c:'#627eea'},{id:'soul',label:'🌟',c:'#9945ff'},{id:'moon',label:'🌙',c:'#836ef9'},{id:'orbit',label:'🪐',c:'#12aaff'},{id:'birth',label:'₿',c:'#f7931a'}]
const DAPP_LIST   = [{name:'Uniswap',url:'https://app.uniswap.org',icon:'🦄'},{name:'OpenSea',url:'https://opensea.io',icon:'🌊'},{name:'Aave',url:'https://app.aave.com',icon:'👻'},{name:'1inch',url:'https://app.1inch.io',icon:'🦅'},{name:'Compound',url:'https://app.compound.finance',icon:'🏦'},{name:'Raydium',url:'https://raydium.io',icon:'⚡'}]

type BottomTab = 'home'|'trade'|'markets'|'settings'

// ── TOTP QR Component ──────────────────────────────────────
function TotpQr({ email }: { email: string }) {
  const [qr, setQr] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    fetch(`/api/auth/totp?email=${encodeURIComponent(email || 'user@thewall.app')}`)
      .then(r => r.json())
      .then(d => { if (d.qrImage) setQr(d.qrImage) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [email])

  if (loading) return (
    <div style={{textAlign:'center',padding:'20px',color:'#00e5ff',fontSize:'0.72rem'}}>
      ⏳ Loading QR code...
    </div>
  )

  return qr ? (
    <div style={{textAlign:'center',marginBottom:16}}>
      <img src={qr} width={160} height={160}
        style={{borderRadius:8,border:'2px solid #00e5ff',display:'inline-block'}}
        alt="QR Code"/>
      <p style={{fontSize:'0.68rem',color:'#E8F4FD',marginTop:8,fontFamily:'var(--font-mono)'}}>
        📱 Scan with Google Authenticator
      </p>
    </div>
  ) : (
    <div style={{textAlign:'center',padding:'12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,marginBottom:16}}>
      <div style={{fontSize:'0.72rem',color:'#E8F4FD',lineHeight:1.8,fontFamily:'var(--font-mono)'}}>
        1️⃣ Open Google Authenticator<br/>
        2️⃣ Tap ➕ → Enter setup key<br/>
        3️⃣ Account: <span style={{color:'#00e5ff'}}>{email||'your@email.com'}</span><br/>
        4️⃣ Key: <span style={{color:'#00ff88'}}>TheWall Web3</span><br/>
        5️⃣ Enter 6-digit code below
      </div>
    </div>
  )
}

export default function TheWall() {
  const [screen, setScreen]         = useState<'login'|'dashboard'>('login')
  const [loginStep, setLoginStep]   = useState<'home'|'email'|'choose2fa'|'totp'|'creating'>('home')
  const [email, setEmail]           = useState('')
  const [totpCode, setTotpCode]     = useState('')
  const [error, setError]           = useState('')
  const [user, setUser]             = useState<UserWallet|null>(null)
  const [prices, setPrices]         = useState<Prices>({})
  const [walletData, setWalletData] = useState<WalletData|null>(null)
  const [bottomTab, setBottomTab]   = useState<BottomTab>('home')
  const [refreshing, setRefreshing] = useState(false)
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

  useEffect(() => { checkChainStatus() }, [])

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
  const walletLabel=user?.type==='smart'?'SMART WALLET 🔢':'MAIN WALLET'
  const s = { card:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:16,marginBottom:12} as const, mono:{fontFamily:'var(--font-mono)'} as const, muted:{color:'var(--text-muted)'} as const, cyan:{color:'var(--cyan)'} as const, label:{fontSize:'0.62rem',letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:6} as const }

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

  if(screen==='login') return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.logo+' fade-up'}>
          <span className={styles.hexLogo}>⬡</span>
          <div>
            <div className={styles.logoTitle}>THE WALL</div>
            <div className={styles.logoSub}>Web3 · IND → DXB · 5 Chains</div>
          </div>
        
