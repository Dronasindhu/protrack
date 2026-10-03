import { Holding, PortfolioSummary } from '../types/portfolio';

export function calculatePortfolioSummary(holdings: Holding[]): PortfolioSummary {
  let totalValue = 0;
  let totalCost = 0;
  let dailyChangeValue = 0;
  let stockValue = 0;
  let cryptoValue = 0;

  let topGainer: { symbol: string; changePercent: number; name: string } | undefined;
  let topLoser: { symbol: string; changePercent: number; name: string } | undefined;

  for (const h of holdings) {
    const value = h.quantity * h.currentPrice;
    const cost = h.quantity * h.avgBuyPrice;
    totalValue += value;
    totalCost += cost;

    if (h.type === 'crypto') {
      cryptoValue += value;
    } else {
      stockValue += value;
    }

    // Daily change calculation for holding:
    // If today price is P and 24h change is C%, yesterday price was P / (1 + C/100)
    // Daily dollar change = value - (quantity * yesterdayPrice)
    const factor = 1 + (h.change24h / 100);
    const prevPrice = factor > 0 ? h.currentPrice / factor : h.currentPrice;
    const itemDailyDollarChange = (h.currentPrice - prevPrice) * h.quantity;
    dailyChangeValue += itemDailyDollarChange;

    if (!topGainer || h.change24h > topGainer.changePercent) {
      topGainer = { symbol: h.symbol, changePercent: h.change24h, name: h.name };
    }
    if (!topLoser || h.change24h < topLoser.changePercent) {
      topLoser = { symbol: h.symbol, changePercent: h.change24h, name: h.name };
    }
  }

  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercentage =
    totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  const prevTotalValue = totalValue - dailyChangeValue;
  const dailyChangePercentage =
    prevTotalValue > 0 ? (dailyChangeValue / prevTotalValue) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercentage,
    dailyChangeValue,
    dailyChangePercentage,
    stockValue,
    cryptoValue,
    topGainer,
    topLoser
  };
}

export function formatCurrency(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (isNaN(value)) return '$0.00';

  // For small crypto values (e.g. < $1.00) show 4 decimal places
  let minDigits = options?.minimumFractionDigits ?? 2;
  let maxDigits = options?.maximumFractionDigits ?? 2;

  if (Math.abs(value) > 0 && Math.abs(value) < 1) {
    minDigits = Math.max(minDigits, 4);
    maxDigits = Math.max(maxDigits, 4);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  }).format(value);
}

export function formatPercentage(value: number, includeSign: boolean = true): string {
  if (isNaN(value)) return '0.00%';
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, maxDigits: number = 4): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxDigits
  }).format(value);
}
