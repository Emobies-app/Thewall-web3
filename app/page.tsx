export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#030508',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00b3f7',
      fontFamily: 'monospace',
      gap: '16px'
    }}>
      <div style={{ fontSize: '3rem' }}>⬡</div>
      <div style={{ fontSize: '1.5rem', letterSpacing: '0.2em' }}>THE WALL</div>
      <div style={{ fontSize: '0.8rem', color: 'rgba(0,179,247,0.5)' }}>
        Kannur → Dubai · DWIN · 2026
      </div>
    </main>
  )
}
