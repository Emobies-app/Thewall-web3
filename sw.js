<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TheWall — SW Fix Guide</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
<style>
  :root {
    --bg: #030508;
    --bg2: #070d14;
    --bg3: #0c1520;
    --border: rgba(0,179,247,0.12);
    --border-bright: rgba(0,179,247,0.35);
    --cyan: #00b3f7;
    --cyan-dim: rgba(0,179,247,0.6);
    --cyan-glow: rgba(0,179,247,0.15);
    --gold: #ffd700;
    --green: #00ff88;
    --red: #ff4466;
    --amber: #ffb347;
    --text: #e8f4fd;
    --text-dim: rgba(232,244,253,0.5);
    --text-muted: rgba(232,244,253,0.25);
    --font-mono: 'Space Mono', monospace;
    --radius: 8px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    min-height: 100vh;
    overflow-x: hidden;
    font-size: 13px;
    line-height: 1.6;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--cyan-dim); border-radius: 2px; }

  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(0,179,247,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,179,247,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none; z-index: 0;
  }
  body::after {
    content: '';
    position: fixed; top: -20%; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(0,179,247,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-glow {
    0%,100% { opacity: 1; } 50% { opacity: 0.4; }
  }
  @keyframes scan {
    0% { top: 0; } 100% { top: 100%; }
  }

  .fade-up-1 { animation: fadeUp 0.5s 0.1s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.2s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.3s ease both; }
  .fade-up-4 { animation: fadeUp 0.5s 0.4s ease both; }
  .fade-up-5 { animation: fadeUp 0.5s 0.5s ease both; }

  .container {
    position: relative; z-index: 1;
    max-width: 820px;
    margin: 0 auto;
    padding: 40px 20px 80px;
  }

  /* ── HEADER ── */
  .header {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 36px;
  }
  .logo {
    width: 52px; height: 52px;
    border: 1px solid var(--border-bright);
    border-radius: var(--radius);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    background: var(--bg3);
    box-shadow: 0 0 24px rgba(0,179,247,0.15);
    flex-shrink: 0;
  }
  .header-text h1 {
    font-size: 18px; font-weight: 700;
    color: var(--cyan); letter-spacing: 2px;
    text-transform: uppercase;
  }
  .header-text p { color: var(--text-dim); font-size: 11px; margin-top: 2px; }
  .live-dot {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 10px; color: var(--green);
    margin-top: 6px;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%;
    background: var(--green); animation: pulse-glow 2s infinite; }

  /* ── PROGRESS BAR ── */
  .progress-bar {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 24px;
    margin-bottom: 28px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .progress-step {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .step-circle {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    border: 2px solid;
  }
  .step-circle.done { border-color: var(--green); color: var(--green); background: rgba(0,255,136,0.08); }
  .step-circle.todo { border-color: var(--amber); color: var(--amber); background: rgba(255,179,71,0.08); }
  .step-label { font-size: 10px; color: var(--text-dim); text-align: center; letter-spacing: 0.5px; }
  .step-status { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }
  .status-done { color: var(--green); }
  .status-todo { color: var(--amber); }

  /* ── SECTION ── */
  .section {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 16px;
    overflow: hidden;
  }
  .section-top {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px;
    cursor: pointer;
    border-bottom: 1px solid transparent;
    transition: background 0.2s;
  }
  .section.open .section-top { border-bottom-color: var(--border); }
  .section-top:hover { background: rgba(0,179,247,0.04); }

  .section-icon {
    width: 32px; height: 32px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .section-title { flex: 1; font-size: 13px; font-weight: 700; letter-spacing: 1px; }
  .section-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

  .tag {
    font-size: 9px; font-weight: 700; letter-spacing: 1px;
    padding: 3px 10px; border-radius: 4px;
    text-transform: uppercase; flex-shrink: 0;
  }
  .tag-red { background: rgba(255,68,102,0.12); color: var(--red); border: 1px solid rgba(255,68,102,0.25); }
  .tag-green { background: rgba(0,255,136,0.08); color: var(--green); border: 1px solid rgba(0,255,136,0.2); }
  .tag-amber { background: rgba(255,179,71,0.1); color: var(--amber); border: 1px solid rgba(255,179,71,0.2); }

  .chevron { color: var(--text-muted); font-size: 10px; margin-left: 6px; transition: transform 0.3s; }
  .section.open .chevron { transform: rotate(180deg); }

  .section-body { display: none; padding: 20px; }
  .section.open .section-body { display: block; }

  /* ── FILE BLOCK ── */
  .file-block {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 16px;
    overflow: hidden;
  }
  .file-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,179,247,0.04);
  }
  .file-path { font-size: 11px; color: var(--cyan); letter-spacing: 0.5px; }
  .file-action {
    font-size: 9px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase;
  }
  .file-action.create { color: var(--green); }
  .file-action.edit { color: var(--amber); }

  .code-block {
    background: var(--bg3);
    padding: 16px;
    overflow-x: auto;
    position: relative;
  }
  .code-block pre {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.8;
    color: var(--text);
    white-space: pre;
  }

  /* syntax */
  .kw { color: #c792ea; }
  .fn { color: var(--cyan); }
  .str { color: #c3e88d; }
  .cm { color: var(--text-muted); font-style: italic; }
  .num { color: var(--gold); }
  .op { color: var(--cyan-dim); }

  .copy-btn {
    position: absolute; top: 10px; right: 10px;
    background: rgba(0,179,247,0.1);
    border: 1px solid var(--border-bright);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 9px; letter-spacing: 1px;
    padding: 4px 10px; border-radius: 4px;
    cursor: pointer; text-transform: uppercase;
    transition: background 0.2s;
  }
  .copy-btn:hover { background: rgba(0,179,247,0.2); }
  .copy-btn.copied { color: var(--green); border-color: rgba(0,255,136,0.3); }

  /* ── NOTE BOX ── */
  .note {
    border-radius: var(--radius); padding: 12px 16px;
    font-size: 11px; line-height: 1.7; margin-bottom: 14px;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .note-warn { background: rgba(255,179,71,0.07); border: 1px solid rgba(255,179,71,0.2); color: var(--amber); }
  .note-info { background: rgba(0,179,247,0.06); border: 1px solid var(--border); color: var(--cyan-dim); }
  .note-ok { background: rgba(0,255,136,0.06); border: 1px solid rgba(0,255,136,0.2); color: var(--green); }
  .note-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
  .note p { color: var(--text-dim); }
  .note strong { color: inherit; }

  /* ── CHECKLIST ── */
  .checklist { display: flex; flex-direction: column; gap: 0; }
  .check-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0,179,247,0.06);
  }
  .check-item:last-child { border-bottom: none; }
  .ci-icon {
    width: 20px; height: 20px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; flex-shrink: 0; margin-top: 1px;
  }
  .ci-green { background: rgba(0,255,136,0.1); color: var(--green); }
  .ci-red { background: rgba(255,68,102,0.1); color: var(--red); }
  .ci-amber { background: rgba(255,179,71,0.1); color: var(--amber); }
  .ci-text h4 { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
  .ci-text p { font-size: 11px; color: var(--text-dim); line-height: 1.6; }

  /* ── FOOTER ── */
  .footer {
    margin-top: 48px; text-align: center;
    font-size: 10px; color: var(--text-muted); line-height: 2;
  }
  .footer .watermark {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 8px 20px; margin-bottom: 12px;
    color: var(--cyan-dim);
  }

  @media (max-width: 600px) {
    .progress-bar { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">

  <!-- HEADER -->
  <div class="header fade-up-1">
    <div class="logo">🧱</div>
    <div class="header-text">
      <h1>TheWall — SW Fix</h1>
      <p>Next.js 14 · Vercel · Space Mono stack</p>
      <div class="live-dot"><span class="dot"></span> 3 files to add / edit</div>
    </div>
  </div>

  <!-- PROGRESS -->
  <div class="progress-bar fade-up-2">
    <div class="progress-step">
      <div class="step-circle done">✓</div>
      <div class="step-label">manifest.json<br/>complete</div>
      <div class="step-status status-done">DONE</div>
    </div>
    <div class="progress-step">
      <div class="step-circle todo">1</div>
      <div class="step-label">Service Worker<br/>sw.js fix</div>
      <div class="step-status status-todo">FIX NEEDED</div>
    </div>
    <div class="progress-step">
      <div class="step-circle todo">2</div>
      <div class="step-label">layout.tsx +<br/>offline page</div>
      <div class="step-status status-todo">ADD NEEDED</div>
    </div>
  </div>

  <!-- SECTION 1: sw.js -->
  <div class="section open fade-up-3">
    <div class="section-top" onclick="toggle(this)">
      <div class="section-icon" style="background:rgba(255,68,102,0.1)">⚙️</div>
      <div>
        <div class="section-title">STEP 1 — public/sw.js</div>
        <div class="section-sub">Replace your current sw.js with this Next.js-aware version</div>
      </div>
      <span class="tag tag-red">REPLACE</span>
      <span class="chevron">▾</span>
    </div>
    <div class="section-body">

      <div class="note note-warn">
        <span class="note-icon">⚠</span>
        <p><strong>Key issue:</strong> Your sw.js must be in <strong>/public/sw.js</strong> — not the project root. Next.js only serves files from /public as static assets at the root URL path.</p>
      </div>

      <div class="note note-info">
        <span class="note-icon">ℹ</span>
        <p>The fetch handler below <strong>skips</strong> your /api/ routes, Alchemy RPC, WalletConnect, CoinGecko, and Anthropic — so your wallet never breaks from cached stale responses.</p>
      </div>

      <div class="file-block">
        <div class="file-header">
          <span class="file-path">📁 public/sw.js</span>
          <span class="file-action create">CREATE / REPLACE</span>
        </div>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">COPY</button>
          <pre><span class="cm">// TheWall Service Worker — Next.js 14 + Vercel</span>
<span class="kw">const</span> <span class="fn">CACHE</span> <span class="op">=</span> <span class="str">'thewall-v2'</span>;

<span class="kw">const</span> <span class="fn">SHELL</span> <span class="op">=</span> [
  <span class="str">'/'</span>,
  <span class="str">'/manifest.json'</span>,
  <span class="str">'/icon-192.png'</span>,
  <span class="str">'/icon-512.png'</span>,
  <span class="str">'/offline'</span>,         <span class="cm">// Next.js offline route</span>
];

<span class="cm">// ── Domains to NEVER cache (live blockchain data)</span>
<span class="kw">const</span> <span class="fn">SKIP_HOSTS</span> <span class="op">=</span> [
  <span class="str">'alchemy.com'</span>,
  <span class="str">'walletconnect.com'</span>,
  <span class="str">'walletconnect.org'</span>,
  <span class="str">'coingecko.com'</span>,
  <span class="str">'anthropic.com'</span>,
  <span class="str">'niledb.com'</span>,
  <span class="str">'helius-rpc.com'</span>,
];

<span class="cm">// ── Install: cache app shell ──────────────────</span>
self.addEventListener(<span class="str">'install'</span>, e <span class="op">=></span> {
  e.waitUntil(
    caches.open(<span class="fn">CACHE</span>)
      .then(c <span class="op">=></span> c.addAll(<span class="fn">SHELL</span>))
      .then(() <span class="op">=></span> self.skipWaiting())
  );
});

<span class="cm">// ── Activate: remove old caches ──────────────</span>
self.addEventListener(<span class="str">'activate'</span>, e <span class="op">=></span> {
  e.waitUntil(
    caches.keys().then(keys <span class="op">=></span>
      Promise.all(
        keys
          .filter(k <span class="op">=></span> k <span class="op">!==</span> <span class="fn">CACHE</span>)
          .map(k <span class="op">=></span> caches.delete(k))
      )
    ).then(() <span class="op">=></span> self.clients.claim())
  );
});

<span class="cm">// ── Fetch: smart caching strategy ────────────</span>
self.addEventListener(<span class="str">'fetch'</span>, e <span class="op">=></span> {
  <span class="kw">const</span> url <span class="op">=</span> <span class="kw">new</span> URL(e.request.url);

  <span class="cm">// Skip non-GET</span>
  <span class="kw">if</span> (e.request.method <span class="op">!==</span> <span class="str">'GET'</span>) <span class="kw">return</span>;

  <span class="cm">// Skip blockchain / AI / external APIs</span>
  <span class="kw">if</span> (<span class="fn">SKIP_HOSTS</span>.some(h <span class="op">=></span> url.hostname.includes(h))) <span class="kw">return</span>;

  <span class="cm">// Skip your own API routes</span>
  <span class="kw">if</span> (url.pathname.startsWith(<span class="str">'/api/'</span>)) <span class="kw">return</span>;

  <span class="cm">// _next/static — cache forever (content-hashed)</span>
  <span class="kw">if</span> (url.pathname.startsWith(<span class="str">'/_next/static/'</span>)) {
    e.respondWith(
      caches.match(e.request).then(cached <span class="op">=></span>
        cached <span class="op">||</span> fetch(e.request).then(res <span class="op">=></span> {
          caches.open(<span class="fn">CACHE</span>)
            .then(c <span class="op">=></span> c.put(e.request, res.clone()));
          <span class="kw">return</span> res;
        })
      )
    );
    <span class="kw">return</span>;
  }

  <span class="cm">// Pages — network first, fallback to cache → offline</span>
  e.respondWith(
    fetch(e.request)
      .then(res <span class="op">=></span> {
        caches.open(<span class="fn">CACHE</span>)
          .then(c <span class="op">=></span> c.put(e.request, res.clone()));
        <span class="kw">return</span> res;
      })
      .catch(() <span class="op">=></span>
        caches.match(e.request)
          .then(cached <span class="op">=></span> cached <span class="op">||</span> caches.match(<span class="str">'/offline'</span>))
      )
  );
});

<span class="cm">// ── Push Notifications ────────────────────────</span>
self.addEventListener(<span class="str">'push'</span>, e <span class="op">=></span> {
  <span class="kw">const</span> d <span class="op">=</span> e.data?.json() <span class="op">??</span> {
    title: <span class="str">'🧱 TheWall'</span>,
    body: <span class="str">'New wallet activity'</span>,
    url: <span class="str">'/'</span>
  };
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: <span class="str">'/icon-192.png'</span>,
      badge: <span class="str">'/icon-192.png'</span>,
      vibrate: [<span class="num">200</span>, <span class="num">100</span>, <span class="num">200</span>],
      data: { url: d.url <span class="op">||</span> <span class="str">'/'</span> },
      actions: [
        { action: <span class="str">'view'</span>, title: <span class="str">'Open Wallet'</span> },
        { action: <span class="str">'dismiss'</span>, title: <span class="str">'Dismiss'</span> }
      ]
    })
  );
});

self.addEventListener(<span class="str">'notificationclick'</span>, e <span class="op">=></span> {
  e.notification.close();
  <span class="kw">if</span> (e.action <span class="op">!==</span> <span class="str">'dismiss'</span>)
    e.waitUntil(clients.openWindow(e.notification.data.url));
});

<span class="cm">// ── Background Sync (queued txs) ──────────────</span>
self.addEventListener(<span class="str">'sync'</span>, e <span class="op">=></span> {
  <span class="kw">if</span> (e.tag <span class="op">===</span> <span class="str">'tx-retry'</span>)
    e.waitUntil(retryTx());
});

<span class="kw">async function</span> <span class="fn">retryTx</span>() {
  <span class="cm">// Read queued txs from IndexedDB → POST to /api/tx</span>
  console.log(<span class="str">'[TheWall SW] retrying queued transactions'</span>);
}</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 2: layout.tsx -->
  <div class="section open fade-up-4">
    <div class="section-top" onclick="toggle(this)">
      <div class="section-icon" style="background:rgba(255,179,71,0.1)">📐</div>
      <div>
        <div class="section-title">STEP 2 — app/layout.tsx</div>
        <div class="section-sub">Add SW registration + viewport meta (2 small additions)</div>
      </div>
      <span class="tag tag-amber">EDIT</span>
      <span class="chevron">▾</span>
    </div>
    <div class="section-body">

      <div class="note note-info">
        <span class="note-icon">ℹ</span>
        <p>Add <strong>two things</strong> to your existing layout.tsx — a useEffect to register the SW, and the theme-color meta tag. Don't replace your whole file, just add these.</p>
      </div>

      <div class="file-block">
        <div class="file-header">
          <span class="file-path">📁 app/layout.tsx — ADD at top</span>
          <span class="file-action edit">EDIT</span>
        </div>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">COPY</button>
          <pre><span class="str">'use client'</span>;                    <span class="cm">// add this if not already present</span>
<span class="kw">import</span> { useEffect } <span class="kw">from</span> <span class="str">'react'</span>;

<span class="cm">// Inside your RootLayout component, add:</span>
useEffect(() <span class="op">=></span> {
  <span class="kw">if</span> (<span class="str">'serviceWorker'</span> <span class="kw">in</span> navigator) {
    navigator.serviceWorker
      .register(<span class="str">'/sw.js'</span>, { scope: <span class="str">'/'</span> })
      .then(r <span class="op">=></span> console.log(<span class="str">'[TheWall SW] ✓'</span>, r.scope))
      .catch(e <span class="op">=></span> console.error(<span class="str">'[TheWall SW] ✗'</span>, e));
  }
}, []);</pre>
        </div>
      </div>

      <div class="file-block">
        <div class="file-header">
          <span class="file-path">📁 app/layout.tsx — ADD in &lt;head&gt;</span>
          <span class="file-action edit">EDIT</span>
        </div>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">COPY</button>
          <pre><span class="cm">// In your metadata export or &lt;head&gt; tag:</span>
&lt;meta name=<span class="str">"theme-color"</span> content=<span class="str">"#030508"</span> /&gt;
&lt;meta name=<span class="str">"apple-mobile-web-app-capable"</span> content=<span class="str">"yes"</span> /&gt;
&lt;meta name=<span class="str">"apple-mobile-web-app-status-bar-style"</span>
      content=<span class="str">"black-translucent"</span> /&gt;
&lt;link rel=<span class="str">"manifest"</span> href=<span class="str">"/manifest.json"</span> /&gt;</pre>
        </div>
      </div>

      <div class="note note-info">
        <span class="note-icon">💡</span>
        <p>If your layout is a <strong>Server Component</strong> (no 'use client'), create a separate <strong>app/sw-register.tsx</strong> client component and import it into layout instead.</p>
      </div>

      <div class="file-block">
        <div class="file-header">
          <span class="file-path">📁 app/sw-register.tsx — if layout is Server Component</span>
          <span class="file-action create">OPTIONAL</span>
        </div>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">COPY</button>
          <pre><span class="str">'use client'</span>;
<span class="kw">import</span> { useEffect } <span class="kw">from</span> <span class="str">'react'</span>;

<span class="kw">export default function</span> <span class="fn">SWRegister</span>() {
  useEffect(() <span class="op">=></span> {
    <span class="kw">if</span> (<span class="str">'serviceWorker'</span> <span class="kw">in</span> navigator) {
      navigator.serviceWorker
        .register(<span class="str">'/sw.js'</span>, { scope: <span class="str">'/'</span> })
        .then(r <span class="op">=></span> console.log(<span class="str">'[TheWall SW] ✓'</span>, r.scope))
        .catch(e <span class="op">=></span> console.error(<span class="str">'[TheWall SW] ✗'</span>, e));
    }
  }, []);
  <span class="kw">return null</span>;  <span class="cm">// renders nothing</span>
}

<span class="cm">// Then in layout.tsx:</span>
<span class="cm">// import SWRegister from './sw-register'</span>
<span class="cm">// &lt;body&gt;&lt;SWRegister /&gt;{children}&lt;/body&gt;</span></pre>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 3: offline page -->
  <div class="section open fade-up-5">
    <div class="section-top" onclick="toggle(this)">
      <div class="section-icon" style="background:rgba(0,179,247,0.1)">📴</div>
      <div>
        <div class="section-title">STEP 3 — app/offline/page.tsx</div>
        <div class="section-sub">Branded offline fallback — shown when no network</div>
      </div>
      <span class="tag tag-amber">CREATE</span>
      <span class="chevron">▾</span>
    </div>
    <div class="section-body">

      <div class="note note-ok">
        <span class="note-icon">✓</span>
        <p>This page uses your <strong>exact globals.css variables</strong> — same Space Mono, same #030508 bg, same cyan. It will feel like a real part of the app.</p>
      </div>

      <div class="file-block">
        <div class="file-header">
          <span class="file-path">📁 app/offline/page.tsx</span>
          <span class="file-action create">CREATE NEW</span>
        </div>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">COPY</button>
          <pre><span class="str">'use client'</span>;
<span class="kw">import</span> { useEffect, useState } <span class="kw">from</span> <span class="str">'react'</span>;

<span class="kw">export default function</span> <span class="fn">OfflinePage</span>() {
  <span class="kw">const</span> [dots, setDots] <span class="op">=</span> useState(<span class="str">'.'</span>);

  useEffect(() <span class="op">=></span> {
    <span class="kw">const</span> t <span class="op">=</span> setInterval(
      () <span class="op">=></span> setDots(d <span class="op">=></span> d.length <span class="op">>=</span> <span class="num">3</span> ? <span class="str">'.'</span> : d <span class="op">+</span> <span class="str">'.'</span>),
      <span class="num">600</span>
    );
    <span class="kw">return</span> () <span class="op">=></span> clearInterval(t);
  }, []);

  <span class="kw">return</span> (
    &lt;main style={{
      background: <span class="str">'var(--bg)'</span>,
      color: <span class="str">'var(--text)'</span>,
      fontFamily: <span class="str">'var(--font-mono)'</span>,
      height: <span class="str">'100vh'</span>,
      display: <span class="str">'flex'</span>,
      flexDirection: <span class="str">'column'</span>,
      alignItems: <span class="str">'center'</span>,
      justifyContent: <span class="str">'center'</span>,
      textAlign: <span class="str">'center'</span>,
      padding: <span class="str">'24px'</span>,
      gap: <span class="str">'16px'</span>
    }}&gt;
      &lt;div style={{ fontSize: <span class="str">'56px'</span> }}&gt;🧱&lt;/div&gt;

      &lt;h1 style={{
        fontSize: <span class="str">'20px'</span>, fontWeight: <span class="str">'700'</span>,
        color: <span class="str">'var(--cyan)'</span>, letterSpacing: <span class="str">'2px'</span>,
        textTransform: <span class="str">'uppercase'</span>
      }}&gt;
        YOU'RE OFFLINE
      &lt;/h1&gt;

      &lt;p style={{ color: <span class="str">'var(--text-dim)'</span>, fontSize: <span class="str">'12px'</span>,
        maxWidth: <span class="str">'280px'</span>, lineHeight: <span class="str">'1.8'</span> }}&gt;
        TheWall needs a connection to reach your wallet{dots}
      &lt;/p&gt;

      &lt;button
        onClick={() <span class="op">=></span> window.location.reload()}
        style={{
          marginTop: <span class="str">'8px'</span>,
          background: <span class="str">'transparent'</span>,
          border: <span class="str">'1px solid var(--border-bright)'</span>,
          color: <span class="str">'var(--cyan)'</span>,
          fontFamily: <span class="str">'var(--font-mono)'</span>,
          fontSize: <span class="str">'11px'</span>, letterSpacing: <span class="str">'2px'</span>,
          padding: <span class="str">'10px 24px'</span>,
          borderRadius: <span class="str">'var(--radius)'</span>,
          cursor: <span class="str">'pointer'</span>,
          textTransform: <span class="str">'uppercase'</span>
        }}
      &gt;
        RETRY CONNECTION
      &lt;/button&gt;
    &lt;/main&gt;
  );
}</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 4: next.config.js -->
  <div class="section fade-up-5">
    <div class="section-top" onclick="toggle(this)">
      <div class="section-icon" style="background:rgba(0,255,136,0.08)">⚡</div>
      <div>
        <div class="section-title">STEP 4 — next.config.js</div>
        <div class="section-sub">Serve sw.js with correct headers so browser trusts it</div>
      </div>
      <span class="tag tag-amber">EDIT</span>
      <span class="chevron">▾</span>
    </div>
    <div class="section-body">
      <div class="file-block">
        <div class="file-header">
          <span class="file-path">📁 next.config.js — add headers()</span>
          <span class="file-action edit">EDIT</span>
        </div>
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)">COPY</button>
          <pre><span class="kw">const</span> nextConfig <span class="op">=</span> {
  <span class="cm">// ...your existing config...</span>

  <span class="kw">async</span> <span class="fn">headers</span>() {
    <span class="kw">return</span> [
      {
        source: <span class="str">'/sw.js'</span>,
        headers: [
          {
            key: <span class="str">'Cache-Control'</span>,
            value: <span class="str">'no-cache, no-store, must-revalidate'</span>
          },
          {
            key: <span class="str">'Content-Type'</span>,
            value: <span class="str">'application/javascript; charset=utf-8'</span>
          },
          {
            key: <span class="str">'Service-Worker-Allowed'</span>,
            value: <span class="str">'/'</span>
          },
        ],
      },
    ];
  },
};

module.exports <span class="op">=</span> nextConfig;</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- CHECKLIST SUMMARY -->
  <div style="background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-top:16px;" class="fade-up-5">
    <div style="font-size:12px; font-weight:700; letter-spacing:2px; color:var(--cyan); margin-bottom:16px; text-transform:uppercase;">
      ⬡ Deploy Checklist
    </div>
    <div class="checklist">
      <div class="check-item">
        <div class="ci-icon ci-red">✗</div>
        <div class="ci-text">
          <h4>Move sw.js → /public/sw.js</h4>
          <p>Currently in project root — Next.js won't serve it from there</p>
        </div>
      </div>
      <div class="check-item">
        <div class="ci-icon ci-red">✗</div>
        <div class="ci-text">
          <h4>Register SW in layout.tsx</h4>
          <p>Add useEffect with navigator.serviceWorker.register('/sw.js')</p>
        </div>
      </div>
      <div class="check-item">
        <div class="ci-icon ci-red">✗</div>
        <div class="ci-text">
          <h4>Create app/offline/page.tsx</h4>
          <p>Branded offline fallback — SW falls back to /offline route</p>
        </div>
      </div>
      <div class="check-item">
        <div class="ci-icon ci-amber">!</div>
        <div class="ci-text">
          <h4>Add SW headers in next.config.js</h4>
          <p>No-cache + Service-Worker-Allowed: / header required</p>
        </div>
      </div>
      <div class="check-item">
        <div class="ci-icon ci-green">✓</div>
        <div class="ci-text">
          <h4>manifest.json — already perfect</h4>
          <p>All fields present, screenshots, shortcuts, maskable icons</p>
        </div>
      </div>
      <div class="check-item">
        <div class="ci-icon ci-green">✓</div>
        <div class="ci-text">
          <h4>After deploy — test in Chrome DevTools</h4>
          <p>Application → Service Workers → check "Activated and running"</p>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="watermark">
      <span class="dot" style="background:var(--cyan)"></span>
      TheWall · thewall.e-mobies.com · PWA Fix Guide
    </div>
    <p>Fix these 4 files → PWABuilder score 75 → 100<br/>
    Built by Thewin (Emobies05) · India 🇮🇳 → Dubai 🇦🇪</p>
  </div>

</div>

<script>
function toggle(el) {
  el.closest('.section').classList.toggle('open');
}
function copyCode(btn) {
  const pre = btn.nextElementSibling;
  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.textContent = 'COPIED!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.classList.remove('copied');
    }, 2000);
  });
}
</script>
</body>
</html>
