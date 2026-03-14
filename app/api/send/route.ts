      {/* ── SEND/RECEIVE MODAL ── */}
      {sendOpen && (
        <div className={styles.searchOverlay} onClick={() => setSendOpen(false)}>
          <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <span className={styles.searchTitle}>
                {sendTab === 'send' ? '📤 Send Crypto' : '📥 Receive'}
              </span>
              <button className={styles.searchClose} onClick={() => setSendOpen(false)}>✕</button>
            </div>

            {/* Send/Receive Tab */}
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['send','receive'].map(t => (
                <button key={t}
                  onClick={() => setSendTab(t as 'send'|'receive')}
                  style={{
                    flex:1, padding:'10px', border:'1px solid',
                    borderColor: sendTab === t ? 'var(--cyan)' : 'var(--border)',
                    borderRadius:8, background: sendTab === t ? 'var(--cyan-glow)' : 'transparent',
                    color: sendTab === t ? 'var(--cyan)' : 'var(--text-muted)',
                    fontFamily:'var(--font-mono)', fontSize:'0.8rem', cursor:'pointer'
                  }}>
                  {t === 'send' ? '📤 Send' : '📥 Receive'}
                </button>
              ))}
            </div>

            {sendTab === 'send' && (
              <div>
                {/* Chain Select */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>SELECT CHAIN</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {['ETH','SOL'].map(c => (
                      <button key={c}
                        onClick={() => setSendChain(c as 'ETH'|'SOL')}
                        style={{
                          flex:1, padding:'10px', border:'1px solid',
                          borderColor: sendChain === c ? (c === 'ETH' ? '#627eea' : '#9945ff') : 'var(--border)',
                          borderRadius:8, background:'var(--bg3)',
                          color: sendChain === c ? (c === 'ETH' ? '#627eea' : '#9945ff') : 'var(--text-muted)',
                          fontFamily:'var(--font-mono)', fontSize:'0.82rem', fontWeight:700, cursor:'pointer'
                        }}>
                        {c === 'ETH' ? '⬡ ETH' : '◎ SOL'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* To Address */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>TO ADDRESS</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      className={styles.searchInput}
                      placeholder={sendChain === 'ETH' ? '0x...' : 'SOL address...'}
                      value={sendTo}
                      onChange={e => setSendTo(e.target.value)}
                      style={{ flex:1 }}
                    />
                    <button
                      onClick={handleQRScan}
                      style={{
                        padding:'0 12px', background:'var(--bg3)',
                        border:'1px solid var(--border)', borderRadius:8,
                        color:'var(--cyan)', fontSize:'1.1rem', cursor:'pointer'
                      }}>
                      📷
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>AMOUNT</div>
                  <div style={{ position:'relative' }}>
                    <input
                      className={styles.searchInput}
                      placeholder="0.00"
                      type="number"
                      value={sendAmount}
                      onChange={e => setSendAmount(e.target.value)}
                      style={{ width:'100%', paddingRight:60 }}
                    />
                    <span style={{
                      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      fontSize:'0.75rem', color: sendChain === 'ETH' ? '#627eea' : '#9945ff',
                      fontWeight:700
                    }}>{sendChain}</span>
                  </div>
                  {sendAmount && prices[sendChain] && (
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:4 }}>
                      ≈ ${(parseFloat(sendAmount || '0') * (prices[sendChain]?.price || 0)).toFixed(2)} USD
                    </div>
                  )}
                </div>

                {/* Address Book */}
                {addressBook.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.08em' }}>ADDRESS BOOK</div>
                    {addressBook.map((entry, i) => (
                      <div key={i}
                        onClick={() => setSendTo(entry.address)}
                        style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'8px 12px', background:'var(--bg2)',
                          border:'1px solid var(--border)', borderRadius:8,
                          marginBottom:6, cursor:'pointer'
                        }}>
                        <span style={{ fontSize:'0.8rem' }}>👤</span>
                        <div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text)' }}>{entry.name}</div>
                          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{entry.address.slice(0,10)}...{entry.address.slice(-6)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add to Address Book */}
                <div style={{ marginBottom:16 }}>
                  <button
                    onClick={() => {
                      const name = prompt('Enter contact name:')
                      if (name && sendTo) {
                        setAddressBook(prev => [...prev, { name, address: sendTo }])
                      }
                    }}
                    style={{
                      background:'none', border:'1px dashed var(--border)',
                      borderRadius:8, color:'var(--text-muted)',
                      fontFamily:'var(--font-mono)', fontSize:'0.72rem',
                      padding:'8px 14px', cursor:'pointer', width:'100%'
                    }}>
                    + Save to Address Book
                  </button>
                </div>

                {sendError && (
                  <div style={{ padding:'10px', background:'rgba(255,68,102,0.08)', border:'1px solid rgba(255,68,102,0.2)', borderRadius:8, color:'var(--red)', fontSize:'0.75rem', marginBottom:12 }}>
                    ⚠ {sendError}
                  </div>
                )}

                {sendSuccess && (
                  <div style={{ padding:'10px', background:'rgba(0,255,136,0.05)', border:'1px solid rgba(0,255,136,0.2)', borderRadius:8, color:'var(--green)', fontSize:'0.75rem', marginBottom:12 }}>
                    ✅ {sendSuccess}
                  </div>
                )}

                <button
                  className={styles.searchBtn}
                  style={{ width:'100%', padding:'13px' }}
                  onClick={handleSend}
                  disabled={sendLoading || !sendTo || !sendAmount}
                >
                  {sendLoading ? '⏳ Processing...' : `📤 Send ${sendChain}`}
                </button>
              </div>
            )}

            {sendTab === 'receive' && (
              <div style={{ textAlign:'center' }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:8, letterSpacing:'0.08em' }}>YOUR WALLET ADDRESS</div>
                  <div style={{
                    padding:'14px', background:'var(--bg2)',
                    border:'1px solid var(--border-bright)', borderRadius:10,
                    fontSize:'0.72rem', color:'var(--cyan)', wordBreak:'break-all',
                    fontFamily:'var(--font-mono)', lineHeight:1.6
                  }}>
                    {user?.address || MAIN_WALLET}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(user?.address || MAIN_WALLET)}
                    style={{
                      marginTop:10, padding:'10px 20px',
                      background:'var(--bg3)', border:'1px solid var(--border-bright)',
                      borderRadius:8, color:'var(--cyan)',
                      fontFamily:'var(--font-mono)', fontSize:'0.8rem', cursor:'pointer'
                    }}>
                    📋 Copy Address
                  </button>
                </div>

                <div style={{ padding:'14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, marginBottom:12 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:8 }}>SOLANA WALLET</div>
                  <div style={{ fontSize:'0.68rem', color:'#9945ff', wordBreak:'break-all', fontFamily:'var(--font-mono)', lineHeight:1.6 }}>
                    {SOL_WALLET}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(SOL_WALLET)}
                    style={{
                      marginTop:8, padding:'8px 16px',
                      background:'rgba(153,69,255,0.1)', border:'1px solid rgba(153,69,255,0.3)',
                      borderRadius:6, color:'#9945ff',
                      fontFamily:'var(--font-mono)', fontSize:'0.72rem', cursor:'pointer'
                    }}>
                    📋 Copy SOL Address
                  </button>
                </div>

                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', lineHeight:1.6 }}>
                  ⚠️ Only send ETH/ERC-20 to ETH address<br/>
                  Only send SOL/SPL to Solana address
                </div>
              </div>
            )}
          </div>
        </div>
      )}
