'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type ButterflyState = 'idle' | 'thinking' | 'answering' | 'loading' | 'happy';

interface Props {
  size?: number;
  state?: ButterflyState;
  onTap?: () => void;
}

const CHAIN_COLORS: [string, string, string][] = [
  ['#627EEA', '#00E5FF', '#4A6CF7'],
  ['#9945FF', '#836EF9', '#7B2FFF'],
  ['#00FF88', '#00E5FF', '#00CC44'],
  ['#12AAFF', '#00E5FF', '#0088CC'],
  ['#F7931A', '#FFD700', '#FF8C00'],
];

const STATE_COLORS: Record<ButterflyState, [string, string, string]> = {
  idle:      ['#9945FF', '#00E5FF', '#627EEA'],
  thinking:  ['#836EF9', '#9945FF', '#5E2B97'],
  answering: ['#00FF88', '#00E5FF', '#00CC44'],
  loading:   ['#627EEA', '#00E5FF', '#1A4FC4'],
  happy:     ['#FFD700', '#F7931A', '#FFAA00'],
};

const WING_SPEED: Record<ButterflyState, number> = {
  idle: 1200, thinking: 250, answering: 400, loading: 300, happy: 200,
};

const STATE_LABEL: Record<ButterflyState, string> = {
  idle: 'Emowall AI', thinking: 'Thinking...', answering: 'Answering ✓', loading: 'Loading...', happy: 'Done! 🦋',
};

// ── Butterfly canvas component ──────────────────────────
export function EmowallButterfly({ size = 120, state = 'idle', onTap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const vals      = useRef({ wing: 0, float: 0, sparkle: 0, pulse: 0, wingDir: 1, colorIdx: 0, colorTimer: 0 });
  const timeRef   = useRef(0);

  const draw = useCallback((colors: [string, string, string]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = size, h = size + 20, cx = w / 2, cy = h / 2;
    const v = vals.current;
    ctx.clearRect(0, 0, w, h);
    const [c1, c2, c3] = colors;
    const spread   = 0.4 + v.wing * 0.6;
    const floatOff = Math.sin(v.float * Math.PI * 2) * 7;
    ctx.save();
    ctx.translate(0, floatOff);

    // glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    glow.addColorStop(0, `${c2}22`); glow.addColorStop(1, `${c2}00`);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, w * 0.5, 0, Math.PI * 2); ctx.fill();

    const drawWing = (path: Path2D, gCenter: [number, number]) => {
      const grad = ctx.createRadialGradient(cx + w * gCenter[0], cy + h * gCenter[1], 0, cx + w * gCenter[0], cy + h * gCenter[1], w * 0.5);
      grad.addColorStop(0, `${c1}E6`); grad.addColorStop(0.6, `${c2}B3`); grad.addColorStop(1, `${c3}66`);
      ctx.fillStyle = grad; ctx.fill(path);
      ctx.shadowColor = c2; ctx.shadowBlur = 4 + v.pulse * 6;
      ctx.strokeStyle = `${c2}${Math.round((0.6 + v.pulse * 0.4) * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.5; ctx.stroke(path); ctx.shadowBlur = 0;
    };

    const luw = new Path2D();
    luw.moveTo(cx, cy - h * 0.05);
    luw.bezierCurveTo(cx - w * 0.15, cy - h * 0.45, cx - w * spread * 0.85, cy - h * 0.35, cx - w * spread * 0.7, cy - h * 0.05);
    luw.bezierCurveTo(cx - w * spread * 0.5, cy + h * 0.05, cx - w * 0.1, cy + h * 0.05, cx, cy - h * 0.05);
    luw.closePath(); drawWing(luw, [-0.5, -0.3]);

    const ruw = new Path2D();
    ruw.moveTo(cx, cy - h * 0.05);
    ruw.bezierCurveTo(cx + w * 0.15, cy - h * 0.45, cx + w * spread * 0.85, cy - h * 0.35, cx + w * spread * 0.7, cy - h * 0.05);
    ruw.bezierCurveTo(cx + w * spread * 0.5, cy + h * 0.05, cx + w * 0.1, cy + h * 0.05, cx, cy - h * 0.05);
    ruw.closePath(); drawWing(ruw, [0.5, -0.3]);

    const llw = new Path2D();
    llw.moveTo(cx, cy + h * 0.05);
    llw.bezierCurveTo(cx - w * 0.1, cy + h * 0.05, cx - w * spread * 0.7, cy + h * 0.05, cx - w * spread * 0.5, cy + h * 0.35);
    llw.bezierCurveTo(cx - w * 0.25, cy + h * 0.42, cx - w * 0.05, cy + h * 0.3, cx, cy + h * 0.05);
    llw.closePath(); drawWing(llw, [-0.3, 0.5]);

    const rlw = new Path2D();
    rlw.moveTo(cx, cy + h * 0.05);
    rlw.bezierCurveTo(cx + w * 0.1, cy + h * 0.05, cx + w * spread * 0.7, cy + h * 0.05, cx + w * spread * 0.5, cy + h * 0.35);
    rlw.bezierCurveTo(cx + w * 0.25, cy + h * 0.42, cx + w * 0.05, cy + h * 0.3, cx, cy + h * 0.05);
    rlw.closePath(); drawWing(rlw, [0.3, 0.5]);

    [[-0.28, -0.18], [0.28, -0.18]].forEach(([dx, dy]) => {
      ctx.shadowColor = c2; ctx.shadowBlur = 5 + v.pulse * 4;
      ctx.fillStyle = `${c2}${Math.round((0.4 + v.pulse * 0.3) * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath(); ctx.arc(cx + w * dx, cy + h * dy, w * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    });

    const body = new Path2D();
    body.moveTo(cx, cy - h * 0.25);
    body.bezierCurveTo(cx - w * 0.04, cy - h * 0.1, cx - w * 0.04, cy + h * 0.1, cx, cy + h * 0.28);
    body.bezierCurveTo(cx + w * 0.04, cy + h * 0.1, cx + w * 0.04, cy - h * 0.1, cx, cy - h * 0.25);
    body.closePath();
    const bg = ctx.createLinearGradient(cx, cy - h * 0.25, cx, cy + h * 0.28);
    bg.addColorStop(0, c1); bg.addColorStop(1, c2);
    ctx.shadowColor = c2; ctx.shadowBlur = 3 + v.pulse * 4; ctx.fillStyle = bg; ctx.fill(body); ctx.shadowBlur = 0;

    ctx.shadowColor = c2; ctx.shadowBlur = 5 + v.pulse * 6; ctx.fillStyle = c2;
    ctx.beginPath(); ctx.arc(cx, cy - h * 0.27, w * 0.055, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    [[-0.02, -0.28], [0.02, -0.28]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.arc(cx + w * dx, cy + h * dy, w * 0.015, 0, Math.PI * 2); ctx.fill();
    });

    ctx.strokeStyle = `${c2}CC`; ctx.lineWidth = 1.2;
    [[-1, -1], [1, 1]].forEach(([sx, ex]) => {
      ctx.beginPath(); ctx.moveTo(cx + w * 0.01 * sx, cy - h * 0.3); ctx.lineTo(cx + w * 0.12 * ex, cy - h * 0.47); ctx.stroke();
      ctx.shadowColor = c1; ctx.shadowBlur = 4 + v.pulse * 3; ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(cx + w * 0.12 * ex, cy - h * 0.47, w * 0.02, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    });

    if (state === 'thinking' || state === 'happy' || state === 'answering') {
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 + v.sparkle * 360) * Math.PI / 180;
        const dist = w * (0.42 + Math.sin(v.sparkle * Math.PI * 2 + i) * 0.08);
        const sx = cx + dist * Math.cos(angle), sy = cy + dist * Math.sin(angle);
        ctx.shadowColor = c2; ctx.shadowBlur = 4; ctx.fillStyle = `${c2}B3`;
        ctx.beginPath(); ctx.arc(sx, sy, w * (0.012 + (i % 3) * 0.005) * (0.5 + Math.sin(v.sparkle * Math.PI * 4 + i) * 0.5), 0, Math.PI * 2);
        ctx.fill(); ctx.shadowBlur = 0;
      }
    }

    ctx.font = `${w * 0.1}px monospace`; ctx.fillStyle = `${c2}CC`;
    ctx.shadowColor = c2; ctx.shadowBlur = 6; ctx.textAlign = 'center';
    ctx.fillText(STATE_LABEL[state], cx, cy + h * 0.45); ctx.shadowBlur = 0;
    ctx.restore();
  }, [size, state]);

  useEffect(() => {
    let last = 0;
    const loop = (ts: number) => {
      const dt = Math.min(ts - last, 50); last = ts; timeRef.current += dt;
      const v = vals.current;
      v.wing += (dt / WING_SPEED[state]) * v.wingDir;
      if (v.wing >= 1) { v.wing = 1; v.wingDir = -1; }
      if (v.wing <= 0) { v.wing = 0; v.wingDir = 1; }
      v.float   = (v.float   + dt / 2400) % 1;
      v.sparkle = (v.sparkle + dt / 1200) % 1;
      v.pulse   = Math.abs(Math.sin(timeRef.current / 1800 * Math.PI));
      if (state === 'idle') { v.colorTimer += dt; if (v.colorTimer >= 3000) { v.colorTimer = 0; v.colorIdx = (v.colorIdx + 1) % CHAIN_COLORS.length; } }
      draw(state === 'idle' ? CHAIN_COLORS[v.colorIdx] : STATE_COLORS[state]);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, draw]);

  return (
    <canvas ref={canvasRef} width={size} height={size + 20} onClick={onTap}
      style={{ cursor: onTap ? 'pointer' : 'default', display: 'block' }} />
  );
}

// ═══════════════════════════════════════════════════════════
// EMOWALL AI CHAT WIDGET — Draggable + Flying Butterfly
// ═══════════════════════════════════════════════════════════

interface Message { role: 'user' | 'ai'; content: string; }

export function EmowallAIChat() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [bState,   setBState]   = useState<ButterflyState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Draggable position ──────────────────────────────────
  const [pos,     setPos]     = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const posRef    = useRef({ x: 0, y: 0 });
  const hasMoved  = useRef(false);

  // ── Flying path ─────────────────────────────────────────
  const [isFlying, setIsFlying] = useState(false);
  const flyRef = useRef({ t: 0, startX: 0, startY: 0, targetX: 0, targetY: 0 });
  const flyRaf = useRef<number>(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  // ── Fly to random position ──────────────────────────────
  const flyToRandom = useCallback(() => {
    const maxX = window.innerWidth  - 100;
    const maxY = window.innerHeight - 160;
    const tx   = Math.random() * maxX;
    const ty   = Math.random() * maxY;
    flyRef.current = { t: 0, startX: posRef.current.x, startY: posRef.current.y, targetX: tx, targetY: ty };
    setIsFlying(true);

    const animate = () => {
      flyRef.current.t += 0.02;
      const { t, startX, startY, targetX, targetY } = flyRef.current;
      if (t >= 1) {
        setPos({ x: targetX, y: targetY });
        posRef.current = { x: targetX, y: targetY };
        setIsFlying(false);
        return;
      }
      // Ease in-out with wave path
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const waveY = Math.sin(t * Math.PI * 3) * 40;
      const nx = startX + (targetX - startX) * ease;
      const ny = startY + (targetY - startY) * ease + waveY;
      setPos({ x: nx, y: ny });
      posRef.current = { x: nx, y: ny };
      flyRaf.current = requestAnimationFrame(animate);
    };
    flyRaf.current = requestAnimationFrame(animate);
  }, []);

  // Auto fly every 8s when idle and not dragging
  useEffect(() => {
    if (isOpen || isDragging) return;
    const interval = setInterval(() => {
      if (!isDragging && !isOpen) flyToRandom();
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, isDragging, flyToRandom]);

  // ── Drag handlers ───────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(flyRaf.current);
    setIsFlying(false);
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      bx: posRef.current.x, by: posRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
    const nx = dragStart.current.bx + dx;
    const ny = dragStart.current.by + dy;
    setPos({ x: nx, y: ny });
    posRef.current = { x: nx, y: ny };
  };

  const onPointerUp = () => {
    setIsDragging(false);
    if (!hasMoved.current) {
      // It was a tap — toggle chat
      setIsOpen(o => !o);
      setBState('happy');
      setTimeout(() => setBState('idle'), 600);
    }
  };

  // ── Send message ────────────────────────────────────────
  const toggle = () => {
    setIsOpen(o => !o);
    setBState('happy');
    setTimeout(() => setBState('idle'), 600);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput(''); setLoading(true);
    setMessages(m => [...m, { role: 'user', content: text }]);
    setBState('thinking'); scrollBottom();
    try {
      const res  = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      setBState('answering');
      setMessages(m => [...m, { role: 'ai', content: data.reply }]);
      scrollBottom();
      setTimeout(() => setBState('idle'), 800);
    } catch {
      setMessages(m => [...m, { role: 'ai', content: '⚠️ Error reaching Emowall AI. Try again!' }]);
      setBState('idle');
    } finally { setLoading(false); }
  };

  // ── Position: fixed bottom-right by default, offset by pos ──
  const right  = Math.max(8, window.innerWidth  - pos.x - 96);
  const bottom = Math.max(8, window.innerHeight - pos.y - 110);
  const useAbsolute = pos.x !== 0 || pos.y !== 0;

  const containerStyle: React.CSSProperties = useAbsolute
    ? { position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        opacity: isDragging ? 0.7 : 1, transition: isDragging ? 'none' : 'opacity 0.3s' }
    : { position: 'fixed', bottom: 80, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 };

  return (
    <div style={containerStyle}>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{ width:300, height:420, background:'#050A14',
                      border:'1px solid #627EEA55', borderRadius:16,
                      display:'flex', flexDirection:'column',
                      boxShadow:'0 0 30px #00E5FF22', fontFamily:'monospace' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid #627EEA44',
                        display:'flex', alignItems:'center', gap:8 }}>
            <EmowallButterfly size={36} state={bState} />
            <div style={{ flex:1 }}>
              <div style={{ color:'#00E5FF', fontSize:12, fontWeight:900 }}>Emowall AI Web3</div>
              <div style={{ color:'#627EEA', fontSize:9 }}>🦋 Always here to help</div>
            </div>
            <button onClick={toggle}
              style={{ background:'none', border:'none', color:'#627EEA', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
            {messages.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column',
                            alignItems:'center', justifyContent:'center', gap:10 }}>
                <EmowallButterfly size={72} state="idle" />
                <div style={{ color:'#627EEA', fontSize:11, textAlign:'center' }}>
                  Hi! I&apos;m Emowall AI Web3 🦋<br />Ask me anything!
                </div>
              </div>
            ) : messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:220 }}>
                <div style={{ padding:'8px 12px', borderRadius:10, fontSize:11,
                              background: msg.role === 'user' ? '#0D1F3C' : '#050F1A',
                              border:`1px solid ${msg.role === 'user' ? '#627EEA66' : '#00E5FF44'}`,
                              color: msg.role === 'user' ? '#E8F4FD' : '#00E5FF' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf:'flex-start' }}>
                <div style={{ color:'#627EEA', fontSize:11, padding:'8px 12px',
                              border:'1px solid #627EEA33', borderRadius:10 }}>
                  🦋 thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:10, borderTop:'1px solid #627EEA44', display:'flex', gap:6 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask Emowall AI..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none',
                       color:'#E8F4FD', fontSize:12, fontFamily:'monospace' }} />
            <button onClick={() => sendMessage(input)}
              style={{ background:'#627EEA22', border:'1px solid #627EEA44',
                       borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'#00E5FF', fontSize:14 }}>➤</button>
          </div>
        </div>
      )}

      {/* FAB Butterfly — Draggable */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none',
                 filter: isFlying ? 'drop-shadow(0 0 12px #00E5FF)' : 'none',
                 transition: isFlying ? 'none' : 'filter 0.3s' }}
      >
        <EmowallButterfly size={80} state={bState} />
      </div>
    </div>
  );
}
