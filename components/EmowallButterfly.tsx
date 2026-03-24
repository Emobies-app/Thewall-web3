'use client'
import { useEffect, useRef, useState } from 'react'

type BfState = 'idle' | 'chat' | 'alert' | 'held'

function playFlutter(fast = false) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const beats = fast ? 12 : 7, gap = fast ? 0.022 : 0.042
    for (let i = 0; i < beats; i++) {
      const t = ctx.currentTime + i * gap
      const sz = Math.floor(ctx.sampleRate * (fast ? 0.02 : 0.035))
      const buf = ctx.createBuffer(1, sz, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let j = 0; j < sz; j++) d[j] = (Math.random()*2-1) * Math.exp(-j/(sz*0.28))
      const src = ctx.createBufferSource(); src.buffer = buf
      const bp = ctx.createBiquadFilter(); bp.type='bandpass'
      bp.frequency.value = fast?3500:2600; bp.Q.value = 0.9
      const g = ctx.createGain()
      const env = Math.sin(Math.PI*i/(beats-1))
      g.gain.setValueAtTime(0,t)
      g.gain.linearRampToValueAtTime(0.042*env, t+0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, t+(fast?0.02:0.035))
      src.connect(bp); bp.connect(g); g.connect(ctx.destination)
      src.start(t); src.stop(t+gap+0.005)
    }
  } catch {}
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator(), g = ctx.createGain()
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime+0.3)
    g.gain.setValueAtTime(0.08, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.3)
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.3)
  } catch {}
}

function getWaypoints(W: number, H: number) {
  return [
    {x:W*.05,y:H*.05},{x:W*.85,y:H*.08},{x:W*.90,y:H*.45},
    {x:W*.80,y:H*.88},{x:W*.45,y:H*.92},{x:W*.10,y:H*.85},
    {x:W*.05,y:H*.50},{x:W*.35,y:H*.15},{x:W*.60,y:H*.55},
    {x:W*.20,y:H*.40},{x:W*.75,y:H*.25},{x:W*.15,y:H*.70},
  ]
}

function ease(t: number) { return t<0.5?2*t*t:-1+(4-2*t)*t }

export default function EmowallButterfly() {
  const bfRef   = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const raf     = useRef<number>(0)
  const frame   = useRef(0)
  const flapAngle  = useRef(0)
  const flapDir    = useRef(1)
  const flapSpeed  = useRef(0.014)
  const targetFlap = useRef(0.014)
  const pos     = useRef({ x: 100, y: 100 })
  const chatPos = useRef({ left: 0, top: 0 })
  const [chatStyle, setChatStyle] = useState({ left: '0px', top: '0px' })
  const wpRef   = useRef<{x:number;y:number}[]>([])
  const wpIdx   = useRef(0)
  const soundInt = useRef<any>(null)
  const stateRef = useRef<BfState>('idle')
  const flyRef   = useRef(true)

  const [state,  setState_]  = useState<BfState>('idle')
  const [flying, setFlying]  = useState(true)
  const [sc,     setSc]      = useState(1)
  const [chatOpen, setChatOpen] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [status, setStatus]  = useState('🦋 Monitoring · Background Security Active')
  const [msgs,   setMsgs]    = useState<{role:'user'|'ai';text:string}[]>([
    {role:'ai', text:'🦋 Hi! I\'m watching over your wallet. Ask me anything!'}
  ])
  const [input, setInput] = useState('')
  const chatHistory = useRef<{role:string;parts:{text:string}[]}[]>([])

  const W = () => window.innerWidth  - 165
  const H = () => window.innerHeight - 155

  function setState(s: BfState) {
    stateRef.current = s
    setState_(s)
  }
  function setFly(v: boolean) {
    flyRef.current = v
    setFlying(v)
  }

  function startSound() {
    if (soundInt.current) clearInterval(soundInt.current)
    soundInt.current = setInterval(() => {
      if (stateRef.current==='idle' && document.hasFocus() && !document.hidden) {
        playFlutter(false)
        targetFlap.current = 0.055
        setTimeout(() => { targetFlap.current = 0.014 }, 1500)
      }
    }, 15000)
  }

  function openChatPanel() {
    const {x,y} = pos.current
    const chatW=300, chatH=Math.min(window.innerHeight*0.6,400), m=14
    let cl=x+165+m, ct=y-10
    if (cl+chatW>window.innerWidth-8) cl=x-chatW-m
    if (cl<8) cl=Math.max(8,(window.innerWidth-chatW)/2)
    ct=Math.max(8,Math.min(ct,window.innerHeight-chatH-8))
    chatPos.current={left:cl,top:ct}
    setChatStyle({left:cl+'px',top:ct+'px'})
    setChatOpen(true)
  }

  function applyState(s: BfState) {
    setState(s)
    if (s==='idle') {
      setFly(true); setStatus('🦋 Monitoring · Background Security Active')
      flapSpeed.current=0.014; targetFlap.current=0.014; startSound()
    } else if (s==='chat') {
      setFly(false); setStatus('🦋 Emowall AI 2.0 · Active')
      flapSpeed.current=0; openChatPanel(); playFlutter(false)
      const cl=chatPos.current.left
      const nx=cl>window.innerWidth/2?20:W()-20
      pos.current={x:nx,y:20}
      if (bfRef.current) { bfRef.current.style.left=nx+'px'; bfRef.current.style.top='20px' }
    } else if (s==='alert') {
      setFly(true); setStatus('🚨 Security Alert · Rush Mode')
      flapSpeed.current=0.06; targetFlap.current=0.06; playAlertSound()
      setAlertVisible(true)
      setTimeout(()=>{ setAlertVisible(false); applyState('idle'); wpRef.current=getWaypoints(W(),H()) },5000)
    } else if (s==='held') {
      setFly(false); setStatus('🦋 Held · Tap to fly again')
      flapSpeed.current=0
    }
  }

  function closeChat() {
    setChatOpen(false); applyState('idle')
    wpRef.current=getWaypoints(W(),H()); wpIdx.current=0
  }

  // Drag butterfly
  const bfDown=useRef(false), bfOX=useRef(0), bfOY=useRef(0)
  const tapMoved=useRef(false), tapStart=useRef(0), holdTimer=useRef<any>(null)

  function onBfDown(e: React.PointerEvent) {
    bfDown.current=true; tapMoved.current=false; tapStart.current=Date.now()
    bfOX.current=e.clientX-pos.current.x; bfOY.current=e.clientY-pos.current.y
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    holdTimer.current=setTimeout(()=>{ if(!tapMoved.current&&stateRef.current==='idle') applyState('held') },500)
  }
  function onBfMove(e: React.PointerEvent) {
    if (!bfDown.current) return
    const nx=Math.max(0,Math.min(W(),e.clientX-bfOX.current))
    const ny=Math.max(0,Math.min(H(),e.clientY-bfOY.current))
    if (Math.abs(nx-pos.current.x)>3||Math.abs(ny-pos.current.y)>3) {
      tapMoved.current=true
      if (stateRef.current==='idle') clearTimeout(holdTimer.current)
    }
    pos.current={x:nx,y:ny}
    if (bfRef.current) { bfRef.current.style.left=nx+'px'; bfRef.current.style.top=ny+'px' }
    if (stateRef.current==='chat') openChatPanel()
  }
  function onBfUp() {
    bfDown.current=false; clearTimeout(holdTimer.current)
    const el=Date.now()-tapStart.current
    if (!tapMoved.current&&el<350) {
      if (stateRef.current==='idle') applyState('chat')
      else if (stateRef.current==='chat') closeChat()
      else if (stateRef.current==='held') applyState('idle')
    }
    if (tapMoved.current&&stateRef.current==='idle') {
      setFly(true); wpRef.current=getWaypoints(W(),H()); wpIdx.current=0
    }
  }

  // Drag chat
  const chatDown=useRef(false), chatOX=useRef(0), chatOY=useRef(0)
  function onChatDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    chatDown.current=true
    chatOX.current=e.clientX-chatPos.current.left; chatOY.current=e.clientY-chatPos.current.top
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); e.preventDefault()
  }
  function onChatMove(e: React.PointerEvent) {
    if (!chatDown.current) return
    const cl=Math.max(0,Math.min(window.innerWidth-310,e.clientX-chatOX.current))
    const ct=Math.max(0,Math.min(window.innerHeight-200,e.clientY-chatOY.current))
    chatPos.current={left:cl,top:ct}
    setChatStyle({left:cl+'px',top:ct+'px'})
    if (chatRef.current) { chatRef.current.style.left=cl+'px'; chatRef.current.style.top=ct+'px' }
  }
  function onChatUp() { chatDown.current=false }

  // Gemini
  async function sendMsg() {
    const val=input.trim(); if (!val) return
    setInput('')
    setMsgs(p=>[...p,{role:'user',text:val}])
    chatHistory.current.push({role:'user',parts:[{text:val}]})
    setMsgs(p=>[...p,{role:'ai',text:'🦋 thinking...'}])
    try {
      const res=await fetch('/api/gemini',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:chatHistory.current})
      })
      const data=await res.json()
      const reply=data?.reply||'🦋 Ask me about your wallet!'
      chatHistory.current.push({role:'model',parts:[{text:reply}]})
      setMsgs(p=>[...p.slice(0,-1),{role:'ai',text:reply}])
    } catch {
      setMsgs(p=>[...p.slice(0,-1),{role:'ai',text:'🦋 Ask me about ETH, SOL, BTC, security or swaps!'}])
    }
  }

  // Animation loop
  useEffect(()=>{
    // Initialize after mount (browser only)
    pos.current = { x: 100, y: 100 }
    wpRef.current = getWaypoints(window.innerWidth-165, window.innerHeight-155)
    startSound()
    function loop() {
      frame.current++
      const s=stateRef.current, fly=flyRef.current
      if (fly && s!=='chat' && s!=='held') {
        flapAngle.current+=flapDir.current*flapSpeed.current
        if (flapAngle.current>=1){flapAngle.current=1;flapDir.current=-1}
        if (flapAngle.current<=0){flapAngle.current=0;flapDir.current=1}
        flapSpeed.current+=(targetFlap.current-flapSpeed.current)*0.06
        setSc(1-ease(flapAngle.current)*0.65)
      } else { setSc(1) }

      if (fly && !bfDown.current && s!=='chat' && s!=='held') {
        const {x,y}=pos.current
        if (s==='idle') {
          const tgt=wpRef.current[wpIdx.current]
          const dx=tgt.x-x, dy=tgt.y-y
          if (Math.sqrt(dx*dx+dy*dy)<45) {
            wpIdx.current=(wpIdx.current+1)%wpRef.current.length
            if (wpIdx.current===0) wpRef.current=getWaypoints(W(),H())
          }
          const ang=Math.atan2(dy,dx), wave=Math.sin(frame.current*0.035)*1.2
          const nx=Math.max(0,Math.min(W(),x+Math.cos(ang)*0.9+Math.cos(ang+Math.PI/2)*wave*0.15))
          const ny=Math.max(0,Math.min(H(),y+Math.sin(ang)*0.9+Math.sin(ang+Math.PI/2)*wave*0.15))
          pos.current={x:nx,y:ny}
          if (bfRef.current){bfRef.current.style.left=nx+'px';bfRef.current.style.top=ny+'px'}
        } else if (s==='alert') {
          const tx=W()/2-80, ty=H()/2-75
          const dx=tx-x, dy=ty-y, dist=Math.sqrt(dx*dx+dy*dy)
          const ang=Math.atan2(dy,dx)
          const nx=Math.max(0,Math.min(W(),x+Math.cos(ang)*Math.min(3.5,dist)))
          const ny=Math.max(0,Math.min(H(),y+Math.sin(ang)*Math.min(3.5,dist)))
          pos.current={x:nx,y:ny}
          if (bfRef.current){bfRef.current.style.left=nx+'px';bfRef.current.style.top=ny+'px'}
        }
      }
      raf.current=requestAnimationFrame(loop)
    }
    raf.current=requestAnimationFrame(loop)
    return ()=>{ cancelAnimationFrame(raf.current); if(soundInt.current)clearInterval(soundInt.current) }
  },[])

  const glow = state==='chat'  ? 'drop-shadow(0 0 20px #00e5ff) drop-shadow(0 0 40px #00e5ffaa)'
             : state==='alert' ? 'drop-shadow(0 0 20px #ff2244) drop-shadow(0 0 40px #ff2244aa)'
             : state==='held'  ? 'drop-shadow(0 0 15px #9945ff) drop-shadow(0 0 30px #9945ff88)'
             :                   'drop-shadow(0 0 20px #00ff88) drop-shadow(0 0 40px #00ff88aa)'

  return (
    <>
      {/* Alert Banner */}
      {alertVisible&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',
        padding:'12px 24px',background:'rgba(255,34,68,0.15)',border:'1px solid #ff2244',
        borderRadius:12,color:'#ff2244',fontSize:'0.8rem',zIndex:99999,fontFamily:'monospace',
        animation:'bfRed 0.6s ease-in-out infinite'}}>
        🚨 Security Alert: Suspicious transaction detected!
      </div>}

      {/* Chat Panel */}
      {chatOpen&&<div ref={chatRef} style={{position:'fixed',width:300,maxHeight:'60vh',left:chatStyle.left,top:chatStyle.top,
        background:'#070e1d',border:'1px solid #627eea33',borderRadius:20,zIndex:9998,
        display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 0 40px #627eea22'}}>
        {/* Header */}
        <div onPointerDown={onChatDown} onPointerMove={onChatMove} onPointerUp={onChatUp}
          style={{padding:'14px 18px 12px',background:'linear-gradient(135deg,#0d1b3e,#0a1628)',
            borderBottom:'1px solid #627eea22',cursor:'grab',userSelect:'none'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:28,height:28,background:'linear-gradient(135deg,#627eea,#9945ff)',
                borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem'}}>⬡</div>
              <span style={{fontSize:'0.85rem',color:'#E8F4FD',fontWeight:700,fontFamily:'monospace'}}>TheWall</span>
            </div>
            <button onClick={closeChat} style={{background:'none',border:'none',
              color:'rgba(232,244,253,0.4)',cursor:'pointer',fontSize:'1.1rem',padding:'2px 6px'}}>✕</button>
          </div>
          <div style={{fontSize:'0.55rem',color:'rgba(232,244,253,0.3)',fontFamily:'monospace',
            letterSpacing:1,textTransform:'uppercase'}}>Emowall AI 2.0 · drag to move</div>
        </div>
        {/* Chain tabs */}
        <div style={{display:'flex',gap:6,padding:'8px 14px',borderBottom:'1px solid #627eea11',overflowX:'auto'}}>
          {[{l:'ETH',c:'#627eea'},{l:'SOL',c:'#9945ff'},{l:'BTC',c:'#f7931a'},{l:'ARB',c:'#12aaff'},{l:'MON',c:'#00e5ff'}].map(t=>(
            <div key={t.l} style={{padding:'3px 8px',borderRadius:20,fontSize:'0.6rem',border:`1px solid ${t.c}55`,
              color:t.c,background:`${t.c}11`,fontFamily:'monospace',whiteSpace:'nowrap',cursor:'pointer'}}>{t.l}</div>
          ))}
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:8,minHeight:100}}>
          {msgs.map((m,i)=><div key={i} style={{
            alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'85%',
            padding:'8px 12px',
            borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',
            background:m.role==='user'?'linear-gradient(135deg,#627eea,#9945ff)':'rgba(99,126,234,0.08)',
            border:m.role==='user'?'none':'1px solid #627eea22',
            fontSize:'0.72rem',color:'#E8F4FD',lineHeight:1.4}}>{m.text}</div>)}
        </div>
        {/* Input */}
        <div style={{padding:'10px 12px',borderTop:'1px solid #627eea11',display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&sendMsg()} placeholder="Ask Emowall AI..."
            style={{flex:1,padding:'8px 10px',background:'rgba(99,126,234,0.06)',
              border:'1px solid #627eea33',borderRadius:10,color:'#E8F4FD',
              fontFamily:'monospace',fontSize:'0.72rem',outline:'none'}}/>
          <button onClick={sendMsg} style={{padding:'8px 12px',
            background:'linear-gradient(135deg,#627eea,#9945ff)',border:'none',
            borderRadius:10,color:'#fff',cursor:'pointer',fontSize:'0.85rem'}}>→</button>
        </div>
      </div>}

      {/* Status */}
      <div style={{position:'fixed',bottom:20,left:16,fontSize:'0.6rem',fontFamily:'monospace',
        color:state==='alert'?'#ff2244':state==='chat'?'#00e5ff':state==='held'?'#9945ff':'rgba(232,244,253,0.3)',
        zIndex:9996,pointerEvents:'none'}}>{status}</div>

      {/* Alert button */}
      <div style={{position:'fixed',bottom:16,right:16,zIndex:9996}}>
        <button onClick={()=>applyState('alert')}
          style={{padding:'6px 12px',borderRadius:8,fontFamily:'monospace',fontSize:'0.65rem',
            cursor:'pointer',border:'1px solid #ff2244',background:'rgba(255,34,68,0.1)',color:'#ff2244'}}>
          🚨 Security Alert
        </button>
      </div>

      {/* Butterfly */}
      <div ref={bfRef} onPointerDown={onBfDown} onPointerMove={onBfMove} onPointerUp={onBfUp}
        style={{position:'fixed',width:160,height:150,cursor:state==='held'?'grab':'pointer',
          zIndex:9999,filter:glow,transition:'filter 0.2s',
          left:pos.current.x,top:pos.current.y}}>
        <svg viewBox="-30 -30 390 360" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
          <defs>
            <radialGradient id="bful" cx="32%" cy="35%" r="72%"><stop offset="0%" stopColor="#3a5fd4" stopOpacity=".96"/><stop offset="55%" stopColor="#627eea" stopOpacity=".9"/><stop offset="100%" stopColor="#1a2f6e" stopOpacity=".88"/></radialGradient>
            <radialGradient id="bfsl" cx="18%" cy="18%" r="46%"><stop offset="0%" stopColor="#9945ff" stopOpacity=".7"/><stop offset="100%" stopColor="#9945ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bfcl" cx="58%" cy="58%" r="42%"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".55"/><stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bfol" cx="72%" cy="32%" r="28%"><stop offset="0%" stopColor="#f7931a" stopOpacity=".62"/><stop offset="100%" stopColor="#f7931a" stopOpacity="0"/></radialGradient>
            <radialGradient id="bfur" cx="68%" cy="35%" r="72%"><stop offset="0%" stopColor="#3a5fd4" stopOpacity=".93"/><stop offset="55%" stopColor="#627eea" stopOpacity=".87"/><stop offset="100%" stopColor="#1a2f6e" stopOpacity=".86"/></radialGradient>
            <radialGradient id="bfsr" cx="82%" cy="18%" r="46%"><stop offset="0%" stopColor="#9945ff" stopOpacity=".66"/><stop offset="100%" stopColor="#9945ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bfcr" cx="42%" cy="58%" r="42%"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".52"/><stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bfor" cx="28%" cy="32%" r="28%"><stop offset="0%" stopColor="#f7931a" stopOpacity=".58"/><stop offset="100%" stopColor="#f7931a" stopOpacity="0"/></radialGradient>
            <radialGradient id="bflbl" cx="35%" cy="28%" r="72%"><stop offset="0%" stopColor="#0c7fc4" stopOpacity=".92"/><stop offset="55%" stopColor="#12aaff" stopOpacity=".85"/><stop offset="100%" stopColor="#055588" stopOpacity=".9"/></radialGradient>
            <radialGradient id="bflsl" cx="20%" cy="18%" r="46%"><stop offset="0%" stopColor="#9945ff" stopOpacity=".52"/><stop offset="100%" stopColor="#9945ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bflcl" cx="55%" cy="62%" r="44%"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".48"/><stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bflgl" cx="45%" cy="68%" r="50%"><stop offset="0%" stopColor="#00ff88" stopOpacity=".5"/><stop offset="100%" stopColor="#00ff88" stopOpacity="0"/></radialGradient>
            <radialGradient id="bflbr" cx="65%" cy="28%" r="72%"><stop offset="0%" stopColor="#0c7fc4" stopOpacity=".9"/><stop offset="55%" stopColor="#12aaff" stopOpacity=".82"/><stop offset="100%" stopColor="#055588" stopOpacity=".88"/></radialGradient>
            <radialGradient id="bflsr" cx="80%" cy="18%" r="46%"><stop offset="0%" stopColor="#9945ff" stopOpacity=".5"/><stop offset="100%" stopColor="#9945ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bflcr" cx="45%" cy="62%" r="44%"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".45"/><stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/></radialGradient>
            <radialGradient id="bflgr" cx="55%" cy="68%" r="50%"><stop offset="0%" stopColor="#00ff88" stopOpacity=".46"/><stop offset="100%" stopColor="#00ff88" stopOpacity="0"/></radialGradient>
            <linearGradient id="bfbody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#00e5ff"/><stop offset="45%" stopColor="#9945ff"/><stop offset="100%" stopColor="#f7931a"/></linearGradient>
            <filter id="bfwg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="bfbg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <g transform="rotate(-20, 164, 130)">
            {/* Left wings */}
            <g style={{transformOrigin:'168px 115px',transform:`scaleX(${sc})`}} filter="url(#bfwg)">
              <path d="M 168 128 C 148 128,100 132,58 148 C 22 162,8 188,22 212 C 36 235,78 242,118 230 C 150 220,168 194,168 158 Z" fill="url(#bflbl)" stroke="#12aaff" strokeWidth=".5" strokeOpacity=".7"/>
              <path d="M 168 128 C 148 128,100 132,58 148 C 22 162,8 188,22 212 C 36 235,78 242,118 230 C 150 220,168 194,168 158 Z" fill="url(#bflsl)"/>
              <path d="M 168 128 C 148 128,100 132,58 148 C 22 162,8 188,22 212 C 36 235,78 242,118 230 C 150 220,168 194,168 158 Z" fill="url(#bflcl)"/>
              <path d="M 168 128 C 148 128,100 132,58 148 C 22 162,8 188,22 212 C 36 235,78 242,118 230 C 150 220,168 194,168 158 Z" fill="url(#bflgl)"/>
              <path d="M 168 100 C 144 58,78 15,24 35 C -2 52,0 95,38 115 C 76 133,146 125,168 118 Z" fill="url(#bful)" stroke="#627eea" strokeWidth=".5" strokeOpacity=".7"/>
              <path d="M 168 100 C 144 58,78 15,24 35 C -2 52,0 95,38 115 C 76 133,146 125,168 118 Z" fill="url(#bfsl)"/>
              <path d="M 168 100 C 144 58,78 15,24 35 C -2 52,0 95,38 115 C 76 133,146 125,168 118 Z" fill="url(#bfcl)"/>
              <path d="M 168 100 C 144 58,78 15,24 35 C -2 52,0 95,38 115 C 76 133,146 125,168 118 Z" fill="url(#bfol)"/>
            </g>
            {/* Right wings */}
            <g style={{transformOrigin:'160px 115px',transform:`scaleX(${sc})`}} filter="url(#bfwg)">
              <path d="M 160 128 C 180 128,228 132,270 148 C 306 162,320 188,306 212 C 292 235,250 242,210 230 C 178 220,160 194,160 158 Z" fill="url(#bflbr)" stroke="#12aaff" strokeWidth=".5" strokeOpacity=".7"/>
              <path d="M 160 128 C 180 128,228 132,270 148 C 306 162,320 188,306 212 C 292 235,250 242,210 230 C 178 220,160 194,160 158 Z" fill="url(#bflsr)"/>
              <path d="M 160 128 C 180 128,228 132,270 148 C 306 162,320 188,306 212 C 292 235,250 242,210 230 C 178 220,160 194,160 158 Z" fill="url(#bflcr)"/>
              <path d="M 160 128 C 180 128,228 132,270 148 C 306 162,320 188,306 212 C 292 235,250 242,210 230 C 178 220,160 194,160 158 Z" fill="url(#bflgr)"/>
              <path d="M 160 100 C 184 58,250 15,304 35 C 330 52,328 95,290 115 C 252 133,182 125,160 118 Z" fill="url(#bfur)" stroke="#627eea" strokeWidth=".5" strokeOpacity=".7"/>
              <path d="M 160 100 C 184 58,250 15,304 35 C 330 52,328 95,290 115 C 252 133,182 125,160 118 Z" fill="url(#bfsr)"/>
              <path d="M 160 100 C 184 58,250 15,304 35 C 330 52,328 95,290 115 C 252 133,182 125,160 118 Z" fill="url(#bfcr)"/>
              <path d="M 160 100 C 184 58,250 15,304 35 C 330 52,328 95,290 115 C 252 133,182 125,160 118 Z" fill="url(#bfor)"/>
            </g>
            {/* Body */}
            <ellipse cx="164" cy="122" rx="5.5" ry="40" fill="url(#bfbody)" filter="url(#bfbg)" opacity=".96"/>
            <ellipse cx="164" cy="122" rx="2.5" ry="26" fill="#00ff88" opacity=".28">
              <animate attributeName="opacity" values=".15;.5;.15" dur="2s" repeatCount="indefinite"/>
            </ellipse>
            {/* Antennae */}
            <path d="M 161 96 Q 147 70,138 53" stroke="#00e5ff" strokeWidth="1.2" fill="none" opacity=".88" strokeLinecap="round"/>
            <circle cx="138" cy="53" r="3.5" fill="#00e5ff"><animate attributeName="r" values="2.5;4.5;2.5" dur="2s" repeatCount="indefinite"/></circle>
            <path d="M 167 96 Q 181 70,190 53" stroke="#9945ff" strokeWidth="1.2" fill="none" opacity=".88" strokeLinecap="round"/>
            <circle cx="190" cy="53" r="3.5" fill="#9945ff"><animate attributeName="r" values="2.5;4.5;2.5" dur="2s" begin=".6s" repeatCount="indefinite"/></circle>
            {/* BTC pulse */}
            <circle cx="164" cy="115" r="4.5" fill={state==='alert'?'#ff2244':'#f7931a'}>
              <animate attributeName="r" values="3;6.5;3" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values=".6;1;.6" dur="2s" repeatCount="indefinite"/>
            </circle>
          </g>
        </svg>
      </div>

      <style>{`@keyframes bfRed{0%,100%{box-shadow:0 0 10px #ff224444}50%{box-shadow:0 0 30px #ff2244aa}}`}</style>
    </>
  )
}

// Named export for layout.tsx
export const EmowallAIChat = EmowallButterfly
