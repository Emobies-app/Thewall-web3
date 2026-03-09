export const ALCHEMY_CONFIG = {
  eth: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
    network: 'eth-mainnet',
  },
  sol: {
    apiKey: process.env.ALCHEMY_SOL_API_KEY || '',
    network: 'solana-mainnet',
  },
}

export const WALLETS = {
  main: '0xba24d47ef3f4e1000000000000000000f3f4e1',
  treasury: '0xecbdebb62d636808a3e94183070585814127393d',
  solana: '5auZoWJxJodSU8dwgKmAfmphv5Z9Su3HAzEdLz1EUZs7',
}
