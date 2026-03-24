import { NextRequest, NextResponse } from 'next/server'

function getSmartReply(msg: string): string {
  const m = msg.toLowerCase().trim()

  // Greetings
  if (m.match(/^(hi|hello|hey|halo|hai|start|yo|sup)$/))
    return '🦋 Hi! I\'m Emowall AI, your Web3 guardian. Ask me about your wallet, chains, security, or crypto!'

  // ETH
  if (m.match(/eth|ethereum|earth/))
    return '🦋 ETH (Earth 🌍) is live on TheWall! Your ETH balance updates in real-time. All transactions are gasless ⚡'

  // SOL
  if (m.match(/sol|solana|soul/))
    return '🦋 SOL (Soul 🌟) — the fastest chain! Your Solana balance is monitored 24/7. Speed + security combined 🦋'

  // BTC
  if (m.match(/btc|bitcoin|birth/))
    return '🦋 BTC (Birth ₿) — the original crypto! Bitcoin started it all in 2009. TheWall monitors your BTC portfolio live 🦋'

  // ARB
  if (m.match(/arb|arbitrum|orbit/))
    return '🦋 ARB (Orbit 🪐) — Ethereum L2! Ultra-fast, ultra-cheap. All ARB transactions on TheWall are FREE ⚡'

  // MON
  if (m.match(/mon|monad|moon/))
    return '🦋 MON (Moon 🌙) — the future is here! Monad is next-gen EVM. TheWall is ready for launch day 🚀'

  // Balance / Portfolio
  if (m.match(/balance|portfolio|total|worth|value|money|how much/))
    return '🦋 Your portfolio is tracked live across ETH, SOL, BTC, ARB and MON! Check the Home tab for real-time values 💰'

  // Send
  if (m.match(/send|transfer|pay|payment/))
    return '🦋 All sends on TheWall are FREE ⚡ — gasless transactions powered by Alchemy Gas Manager! No hidden fees 🦋'

  // Receive
  if (m.match(/receive|deposit|address/))
    return '🦋 Tap Receive in the Send panel to get your wallet address! ETH and SOL addresses are separate 📥'

  // Swap
  if (m.match(/swap|exchange|trade|convert/))
    return '🦋 Swap any token on the Trade tab! Powered by UniSwap V3 with 0% gas fees. Best rates guaranteed 🔄'

  // Security
  if (m.match(/security|safe|protect|hack|danger|risk/))
    return '🦋 TheWall uses 5FA: Earth🌍 Soul🌟 Moon🌙 Orbit🪐 Birth₿. Your wallet has military-grade protection 🛡️'

  // Price alerts
  if (m.match(/alert|notify|notification|price alert/))
    return '🦋 Set price alerts in Markets tab! Get notified instantly when ETH, SOL or BTC hit your target 🔔'

  // Charts
  if (m.match(/chart|graph|price|market|trend/))
    return '🦋 Live charts available in the Markets tab! 1D, 7D, 1M, 3M, 1Y views for all major tokens 📊'

  // News
  if (m.match(/news|latest|update|happening/))
    return '🦋 Fresh crypto news in the Markets → News tab! Curated Web3 updates with sentiment analysis 📰'

  // EmoCoins
  if (m.match(/emocoin|emc|emobies|emo coin/))
    return '🦋 EmoCoins (EMC) are TheWall\'s native token! Claim daily rewards and use across the Dwin Universe 🪙'

  // DApps
  if (m.match(/dapp|uniswap|opensea|aave|raydium|1inch|compound/))
    return '🦋 Access top DApps from Settings → DApps! Uniswap, OpenSea, Aave and more — all in one place 🌐'

  // Gas
  if (m.match(/gas|fee|cost|free/))
    return '🦋 All transactions on TheWall are completely FREE ⚡ Powered by Alchemy Gas Manager — no gas ever!'

  // Seed phrase
  if (m.match(/seed|phrase|recovery|mnemonic|private key/))
    return '🦋 TheWall = No Seed Phrase! Your wallet is secured with 2FA + 5-chain authentication. Much safer! 🔐'

  // WalletConnect
  if (m.match(/connect|walletconnect|wallet connect/))
    return '🦋 Connect any external wallet via WalletConnect in the Trade tab! Full Web3 integration 🔗'

  // Freeze
  if (m.match(/freeze|lock|emergency|stolen/))
    return '🦋 Emergency? Go to Settings → Security → Freeze Wallet! Instantly locks all transactions 🔒'

  // TheWall info
  if (m.match(/thewall|the wall|wall|dwin|divin/))
    return '🦋 TheWall is a 5-chain Web3 wallet built by Divin (Dwin Universe). ETH · SOL · BTC · ARB · MON 🌍'

  // Help
  if (m.match(/help|what can|support|assist/))
    return '🦋 I can help with: Wallet balance · Send/Receive · Swap · Security · Price alerts · DApps · Charts! Ask me anything 🦋'

  // Thanks
  if (m.match(/thank|thanks|thx|ty|great|good|nice|perfect|wow/))
    return '🦋 Happy to help! Your wallet is always safe with me watching. Ask anything anytime 😊'

  // Default
  return '🦋 I\'m monitoring your wallet across 5 chains! Ask me about ETH, SOL, BTC, ARB, MON, security, swaps, or alerts 🌍'
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMsg = messages?.[messages.length - 1]
    const text = lastMsg?.parts?.[0]?.text || lastMsg?.text || 'hi'
    const reply = getSmartReply(text)
    return NextResponse.json({ reply })
  } catch (e) {
    return NextResponse.json({ reply: '🦋 Ask me about your wallet, chains, or security!' })
  }
}
