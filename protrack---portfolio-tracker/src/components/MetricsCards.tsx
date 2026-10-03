import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Calendar, 
  PieChart 
} from 'lucide-react';
import { PortfolioSummary } from '../types/portfolio';
import { formatCurrency, formatPercentage } from '../utils/portfolioMath';

interface MetricsCardsProps {
  summary: PortfolioSummary;
  totalAssetsCount: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ summary, totalAssetsCount }) => {
  const isProfit = summary.totalProfitLoss >= 0;
  const isDailyGain = summary.dailyChangeValue >= 0;

  const stockPercent = summary.totalValue > 0 
    ? (summary.stockValue / summary.totalValue) * 100 
    : 0;
  const cryptoPercent = summary.totalValue > 0 
    ? (summary.cryptoValue / summary.totalValue) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Portfolio Value */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Portfolio Value</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {formatCurrency(summary.totalValue)}
          </h2>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span>Cost Basis: <span className="text-slate-300 font-mono tabular-nums">{formatCurrency(summary.totalCost)}</span></span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>{totalAssetsCount} {totalAssetsCount === 1 ? 'Holding' : 'Holdings'}</span>
        </div>
      </div>

      {/* 2. Total Profit / Loss */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Profit / Loss</span>
          <div className={`w-8 h-8 rounded-lg ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} flex items-center justify-center`}>
            {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfit ? '+' : ''}{formatCurrency(summary.totalProfitLoss)}
          </h2>
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
            isProfit 
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
          } font-mono tabular-nums`}>
            {formatPercentage(summary.totalProfitLossPercentage)}
          </span>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          <span>Return on Investment (ROI)</span>
        </div>
      </div>

      {/* 3. 24h Daily Change */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">24h Daily Change</span>
          <div className={`w-8 h-8 rounded-lg ${isDailyGain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} flex items-center justify-center`}>
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${isDailyGain ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isDailyGain ? '+' : ''}{formatCurrency(summary.dailyChangeValue)}
          </h2>
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
            isDailyGain 
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
          } font-mono tabular-nums`}>
            {formatPercentage(summary.dailyChangePercentage)}
          </span>
        </div>
        <div className="mt-3 text-xs text-slate-400 truncate">
          {summary.topGainer ? (
            <span>Top mover: <strong className="text-slate-200">{summary.topGainer.symbol}</strong> ({formatPercentage(summary.topGainer.changePercent)})</span>
          ) : (
            <span>Intraday portfolio shift</span>
          )}
        </div>
      </div>

      {/* 4. Asset Allocation Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Asset Class Split</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        
        {/* Progress Bar Split */}
        <div className="mt-4">
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${stockPercent}%` }} 
              className="bg-blue-500 transition-all duration-500" 
              title={`Stocks: ${stockPercent.toFixed(1)}%`}
            />
            <div 
              style={{ width: `${cryptoPercent}%` }} 
              className="bg-amber-400 transition-all duration-500" 
              title={`Crypto: ${cryptoPercent.toFixed(1)}%`}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span>Stocks:</span>
            <span className="font-semibold text-white">{stockPercent.toFixed(1)}%</span>
            <span className="text-slate-500 text-[11px]">({formatCurrency(summary.stockValue)})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            <span>Crypto:</span>
            <span className="font-semibold text-white">{cryptoPercent.toFixed(1)}%</span>
            <span className="text-slate-500 text-[11px]">({formatCurrency(summary.cryptoValue)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
