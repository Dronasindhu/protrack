import React, { useState, useMemo } from 'react';
import { 
  Holding, 
  AssetType 
} from '../types/portfolio';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber 
} from '../utils/portfolioMath';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Coins, 
  Briefcase,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';

interface HoldingsTableProps {
  holdings: Holding[];
  totalPortfolioValue: number;
  onEdit: (holding: Holding) => void;
  onDelete: (id: string, symbol: string) => void;
  onQuickTrade: (holding: Holding) => void;
}

type SortField = 
  | 'symbol'
  | 'type'
  | 'currentPrice'
  | 'change24h'
  | 'quantity'
  | 'avgBuyPrice'
  | 'totalValue'
  | 'profitLoss'
  | 'allocation';

type SortDirection = 'asc' | 'desc';

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  totalPortfolioValue,
  onEdit,
  onDelete,
  onQuickTrade
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | AssetType>('all');
  const [sortField, setSortField] = useState<SortField>('totalValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter & Search
  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      const matchesType = selectedType === 'all' || h.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.symbol.toLowerCase().includes(q) ||
        h.name.toLowerCase().includes(q) ||
        (h.notes && h.notes.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [holdings, selectedType, searchQuery]);

  // Sort
  const sortedHoldings = useMemo(() => {
    const list = [...filteredHoldings];
    list.sort((a, b) => {
      const aVal = a.quantity * a.currentPrice;
      const bVal = b.quantity * b.currentPrice;
      const aCost = a.quantity * a.avgBuyPrice;
      const bCost = b.quantity * b.avgBuyPrice;
      const aPL = aVal - aCost;
      const bPL = bVal - bCost;
      const aAlloc = totalPortfolioValue > 0 ? aVal / totalPortfolioValue : 0;
      const bAlloc = totalPortfolioValue > 0 ? bVal / totalPortfolioValue : 0;

      let comparison = 0;
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'currentPrice':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'change24h':
          comparison = a.change24h - b.change24h;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'avgBuyPrice':
          comparison = a.avgBuyPrice - b.avgBuyPrice;
          break;
        case 'totalValue':
          comparison = aVal - bVal;
          break;
        case 'profitLoss':
          comparison = aPL - bPL;
          break;
        case 'allocation':
          comparison = aAlloc - bAlloc;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredHoldings, sortField, sortDirection, totalPortfolioValue]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
    );
  };

  const stockCount = holdings.filter((h) => h.type === 'stock').length;
  const cryptoCount = holdings.filter((h) => h.type === 'crypto').length;

  return (
    <div className="mt-8 bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      {/* Table Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-lg shrink-0">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedType === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setSelectedType('stock')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedType === 'stock'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>Stocks ({stockCount})</span>
          </button>
          <button
            onClick={() => setSelectedType('crypto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedType === 'crypto'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Crypto ({cryptoCount})</span>
          </button>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ticker, name, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {/* Asset Column */}
              <th className="py-3.5 px-4 sm:px-6">
                <button
                  onClick={() => handleSort('symbol')}
                  className="flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider"
                >
                  <span>Asset</span>
                  {getSortIcon('symbol')}
                </button>
              </th>

              {/* Price & 24h Change */}
              <th className="py-3.5 px-4 text-right">
                <button
                  onClick={() => handleSort('currentPrice')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>Current Price</span>
                  {getSortIcon('currentPrice')}
                </button>
              </th>

              {/* 24h Change */}
              <th className="py-3.5 px-4 text-right">
                <button
                  onClick={() => handleSort('change24h')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>24h Change</span>
                  {getSortIcon('change24h')}
                </button>
              </th>

              {/* Holdings (Quantity) */}
              <th className="py-3.5 px-4 text-right">
                <button
                  onClick={() => handleSort('quantity')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>Holdings</span>
                  {getSortIcon('quantity')}
                </button>
              </th>

              {/* Avg Buy Price (Cost Basis) */}
              <th className="py-3.5 px-4 text-right hidden md:table-cell">
                <button
                  onClick={() => handleSort('avgBuyPrice')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>Avg Buy Price</span>
                  {getSortIcon('avgBuyPrice')}
                </button>
              </th>

              {/* Market Value */}
              <th className="py-3.5 px-4 text-right">
                <button
                  onClick={() => handleSort('totalValue')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>Total Value</span>
                  {getSortIcon('totalValue')}
                </button>
              </th>

              {/* Total Return (Profit / Loss) */}
              <th className="py-3.5 px-4 text-right">
                <button
                  onClick={() => handleSort('profitLoss')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>Total Return</span>
                  {getSortIcon('profitLoss')}
                </button>
              </th>

              {/* Allocation */}
              <th className="py-3.5 px-4 text-right hidden lg:table-cell">
                <button
                  onClick={() => handleSort('allocation')}
                  className="inline-flex items-center gap-1.5 group hover:text-slate-200 uppercase tracking-wider ml-auto"
                >
                  <span>Portfolio %</span>
                  {getSortIcon('allocation')}
                </button>
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 sm:px-6 text-right">
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {sortedHoldings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto">
                    <Info className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No holdings found</p>
                    <p className="text-xs mt-1 text-slate-500">
                      {searchQuery
                        ? 'Try adjusting your search query or clear the filter.'
                        : 'Your portfolio is currently empty. Click "Add Asset" to start tracking.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedHoldings.map((h) => {
                const marketValue = h.quantity * h.currentPrice;
                const costBasis = h.quantity * h.avgBuyPrice;
                const profitLoss = marketValue - costBasis;
                const profitLossPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
                const isProfit = profitLoss >= 0;
                const isDailyUp = h.change24h >= 0;
                const allocationPct =
                  totalPortfolioValue > 0 ? (marketValue / totalPortfolioValue) * 100 : 0;

                return (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-800/35 transition-colors group"
                  >
                    {/* Asset Name & Type */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                            h.type === 'crypto'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {h.symbol.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono">{h.symbol}</span>
                            <span className="text-[10px] text-slate-500 capitalize">
                              · {h.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" title={h.name}>
                            {h.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span className="font-semibold text-white">
                        {formatCurrency(h.currentPrice)}
                      </span>
                    </td>

                    {/* 24h Change */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                          isDailyUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isDailyUp ? (
                          <TrendingUp className="w-3 h-3 inline" />
                        ) : (
                          <TrendingDown className="w-3 h-3 inline" />
                        )}
                        {formatPercentage(h.change24h)}
                      </span>
                    </td>

                    {/* Holdings Quantity */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      <div className="font-semibold">{formatNumber(h.quantity, 6)}</div>
                      <div className="text-[10px] text-slate-500">{h.symbol}</div>
                    </td>

                    {/* Avg Buy Price (Cost Basis) */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums hidden md:table-cell text-slate-400">
                      <div>{formatCurrency(h.avgBuyPrice)}</div>
                      <div className="text-[10px] text-slate-600">
                        Total: {formatCurrency(costBasis)}
                      </div>
                    </td>

                    {/* Total Value */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-100 text-[13px]">
                        {formatCurrency(marketValue)}
                      </span>
                    </td>

                    {/* Total Return */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <div
                        className={`font-semibold ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {formatCurrency(profitLoss)}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isProfit ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatPercentage(profitLossPct)}
                      </div>
                    </td>

                    {/* Allocation % */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums hidden lg:table-cell">
                      <div className="text-slate-300 font-medium">
                        {allocationPct.toFixed(1)}%
                      </div>
                      <div className="w-16 h-1 bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, allocationPct)}%` }}
                          className={`h-full ${
                            h.type === 'crypto' ? 'bg-amber-400' : 'bg-blue-400'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Trade / Adjust Position */}
                        <button
                          onClick={() => onQuickTrade(h)}
                          title="Quick Buy / Sell adjustment"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEdit(h)}
                          title="Edit holding details"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDelete(h.id, h.symbol)}
                          title="Delete holding"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary bar */}
      <div className="py-3 px-4 sm:px-6 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span>Showing {sortedHoldings.length} of {holdings.length} assets</span>
          {searchQuery && (
            <span className="text-emerald-400">· Filtered by &ldquo;{searchQuery}&rdquo;</span>
          )}
        </div>
        <div className="flex items-center gap-4 font-mono tabular-nums">
          <span>Total Market Value: <strong className="text-white">{formatCurrency(totalPortfolioValue)}</strong></span>
        </div>
      </div>
    </div>
  );
};
