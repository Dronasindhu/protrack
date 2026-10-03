import { AssetPreset, Holding } from '../types/portfolio';

export const POPULAR_PRESETS: AssetPreset[] = [
  // Stocks
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', defaultPrice: 233.95 },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', defaultPrice: 370.59 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', defaultPrice: 633.91 },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', defaultPrice: 333.69 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', defaultPrice: 517.53 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', defaultPrice: 251.52 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', type: 'stock', defaultPrice: 341.86 },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', defaultPrice: 727.52 },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', type: 'stock', defaultPrice: 188.75 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'stock', defaultPrice: 615.40 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'stock', defaultPrice: 535.80 },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'stock', defaultPrice: 265.40 },
  
  // Cryptos
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', coingeckoId: 'bitcoin', defaultPrice: 84550.0 },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', coingeckoId: 'ethereum', defaultPrice: 2662.0 },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', coingeckoId: 'solana', defaultPrice: 118.40 },
  { symbol: 'BNB', name: 'BNB', type: 'crypto', coingeckoId: 'binancecoin', defaultPrice: 585.0 },
  { symbol: 'XRP', name: 'XRP', type: 'crypto', coingeckoId: 'ripple', defaultPrice: 0.585 },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', coingeckoId: 'cardano', defaultPrice: 0.36 },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', coingeckoId: 'dogecoin', defaultPrice: 0.125 },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', coingeckoId: 'avalanche-2', defaultPrice: 28.60 },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto', coingeckoId: 'chainlink', defaultPrice: 11.90 },
  { symbol: 'SUI', name: 'Sui', type: 'crypto', coingeckoId: 'sui', defaultPrice: 2.15 },
  { symbol: 'NEAR', name: 'NEAR Protocol', type: 'crypto', coingeckoId: 'near', defaultPrice: 5.25 },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto', coingeckoId: 'polkadot', defaultPrice: 4.45 }
];

export const CRYPTO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  DOT: 'polkadot',
  MATIC: 'polygon-ecosystem-token',
  POL: 'polygon-ecosystem-token',
  SUI: 'sui',
  NEAR: 'near',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  FIL: 'filecoin',
  APT: 'aptos',
  RENDER: 'render-token',
  TAO: 'bittensor',
  FET: 'artificial-superintelligence-alliance'
};

export const INITIAL_HOLDINGS: Holding[] = [
  {
    id: 'hold_nvda_1',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'stock',
    quantity: 25,
    avgBuyPrice: 175.0,
    currentPrice: 233.95,
    change24h: 1.85,
    createdAt: '2024-04-15T10:00:00Z',
    notes: 'AI chips leader long-term hold'
  },
  {
    id: 'hold_tsla_2',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    quantity: 15,
    avgBuyPrice: 260.0,
    currentPrice: 370.59,
    change24h: -0.92,
    createdAt: '2024-05-10T12:00:00Z',
    notes: 'EV & robotics exposure'
  },
  {
    id: 'hold_amd_3',
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    type: 'stock',
    quantity: 30,
    avgBuyPrice: 420.0,
    currentPrice: 633.91,
    change24h: 2.14,
    createdAt: '2024-06-01T14:30:00Z',
    notes: 'Datacenter & MI300 expansion'
  },
  {
    id: 'hold_btc_4',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    coingeckoId: 'bitcoin',
    quantity: 0.35,
    avgBuyPrice: 65000.0,
    currentPrice: 84550.0,
    change24h: 2.45,
    createdAt: '2024-02-20T08:15:00Z',
    notes: 'Digital store of value core holding'
  },
  {
    id: 'hold_eth_5',
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    coingeckoId: 'ethereum',
    quantity: 3.5,
    avgBuyPrice: 2400.0,
    currentPrice: 2662.0,
    change24h: 1.12,
    createdAt: '2024-03-12T16:45:00Z',
    notes: 'Smart contract ecosystem'
  },
  {
    id: 'hold_sol_6',
    symbol: 'SOL',
    name: 'Solana',
    type: 'crypto',
    coingeckoId: 'solana',
    quantity: 40,
    avgBuyPrice: 92.0,
    currentPrice: 118.40,
    change24h: 3.65,
    createdAt: '2024-04-01T11:20:00Z',
    notes: 'High throughput DeFi & consumer crypto'
  }
];
