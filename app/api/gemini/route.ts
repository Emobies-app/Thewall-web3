import { NextRequest, NextResponse } from 'next/server'

function getReply(msg: string): string {
  const m = msg.toLowerCase().trim()

  if (m.match(/^(hi|hello|hey|halo|hai)$/))
    return '🦋 Hi! I\'m Emowall AI, your Web3 guardian. Ask me about your wallet, chains, or security!'
  if (m.match(/eth|ethereum/))
    return '🦋 ETH (Earth 🌍) is live on TheWall! Your ETH balance updates in real-time. Gasless ⚡'
  if (m.match(/sol|solana/))
    return '🦋 SOL (Soul 🌟) — fastest chain! Solana monitored 24/7 on TheWall 🦋'
  if (m.match(/btc|bitcoin/))
    return '🦋 BTC (Birth ₿) — the original! Bitcoin monitored live on TheWall 🦋'
  if (m.match(/arb|arbitrum/))
    return '🦋 ARB (Orbit 🪐) — Ethereum L2! Ultra-fast, gasless on TheWall ⚡'
  if (m.match(/mon|monad/))
    return '🦋 MON (Moon 🌙) — next-gen EVM! TheWall is ready for Monad launch 🚀'
  if (m.match(/balance|portfolio|total/))
    return '🦋 Your portfolio is tracked live across all 5 chains! Check Home tab 💰'
  if (m.match(/send|transfer/))
    return '🦋 All sends are FREE ⚡ Powered by Alchemy Gas Manager!'
  if (m.match(/swap|exchange/))
    return '🦋 Swap tokens on Trade tab! UniSwap V3, 0% gas 🔄'
  if (m.match(/security|safe|protect/))
    return '🦋 TheWall uses 5FA: Earth🌍 Soul🌟 Moon🌙 Orbit🪐 Birth₿ 🛡️'
  if (m.match(/alert|price/))
    return '🦋 Set price alerts in Markets tab! Get notified instantly 🔔'
  if (m.match(/help|what can/))
    return '🦋 Ask me about wallet, chains, send, swap, security or alerts!'
  if (m.match(/thank|thanks|great|good/))
    return '🦋 Happy to help! Your wallet is always safe with me watching 😊'

  return '🦋 I\'m monitoring your wallet across 5 chains! Ask me about ETH, SOL, BTC, ARB, MON 🌍'
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const last = messages?.[messages.length - 1]
    const text = last?.parts?.[0]?.text || last?.text || 'hi'
    return NextResponse.json({ reply: getReply(text) })
  } catch {
    return NextResponse.json({ reply: '🦋 Ask me about your wallet!' })
  }
}
