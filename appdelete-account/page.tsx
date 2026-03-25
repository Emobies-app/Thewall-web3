export default function DeleteAccount() {
  return (
    <div style={{
      minHeight:'100vh',
      background:'#060c1a',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      padding:24,
      fontFamily:'monospace',
      color:'#E8F4FD'
    }}>
      <div style={{
        maxWidth:480,
        width:'100%',
        background:'#0a1628',
        border:'1px solid #627eea33',
        borderRadius:20,
        padding:32,
        textAlign:'center'
      }}>
        <div style={{fontSize:'2.5rem',marginBottom:16}}>⬡</div>
        <div style={{fontSize:'1.1rem',fontWeight:700,color:'#627eea',marginBottom:8}}>
          THE WALL
        </div>
        <div style={{fontSize:'0.85rem',color:'rgba(232,244,253,0.6)',marginBottom:24}}>
          Account Deletion Request
        </div>

        <div style={{
          background:'rgba(255,68,102,0.08)',
          border:'1px solid rgba(255,68,102,0.2)',
          borderRadius:12,
          padding:16,
          marginBottom:24,
          fontSize:'0.78rem',
          color:'rgba(232,244,253,0.7)',
          lineHeight:1.8,
          textAlign:'left'
        }}>
          <strong style={{color:'#ff4466'}}>⚠️ Before you delete:</strong><br/>
          • All wallet data will be removed<br/>
          • Transaction history will be deleted<br/>
          • This action cannot be undone<br/>
          • Withdraw any remaining funds first
        </div>

        <div style={{fontSize:'0.78rem',color:'rgba(232,244,253,0.5)',marginBottom:16}}>
          To delete your account, send an email to:
        </div>

        <a
          href="mailto:thewallwallet@gmail.com?subject=Delete My TheWall Account&body=Please delete my TheWall account and all associated data. My registered email is: [your email]"
          style={{
            display:'block',
            padding:'14px 24px',
            background:'rgba(255,68,102,0.1)',
            border:'1px solid rgba(255,68,102,0.3)',
            borderRadius:12,
            color:'#ff4466',
            textDecoration:'none',
            fontSize:'0.85rem',
            fontWeight:700,
            marginBottom:16
          }}
        >
          📧 Request Account Deletion
        </a>

        <div style={{fontSize:'0.68rem',color:'rgba(232,244,253,0.3)',lineHeight:1.8}}>
          thewallwallet@gmail.com<br/>
          We will process your request within 7 days.<br/>
          All data will be permanently deleted.
        </div>
      </div>

      <div style={{
        marginTop:24,
        fontSize:'0.62rem',
        color:'rgba(232,244,253,0.2)'
      }}>
        ⬡ THE WALL · DWIN · 2026 · 🇮🇳🇦🇪
      </div>
    </div>
  )
}
