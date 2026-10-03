export type AssetType = 'stock' | 'crypto';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  change24h: number; // percentage, e.g. +3.42 or -1.85
  high24h?: number;
  low24h?: number;
  coingeckoId?: string;
  notes?: string;
  createdAt: string;
  lastUpdated?: string;
  priceSource?: 'live' | 'cached' | 'fallback' | 'manual';
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  dailyChangeValue: number;
  dailyChangePercentage: number;
  stockValue: number;
  cryptoValue: number;
  topGainer?: { symbol: string; changePercent: number; name: string };
  topLoser?: { symbol: string; changePercent: number; name: string };
}

export interface AssetPreset {
  symbol: string;
  name: string;
  type: AssetType;
  coingeckoId?: string;
  defaultPrice: number;
}
