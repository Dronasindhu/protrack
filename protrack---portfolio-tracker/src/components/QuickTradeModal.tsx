import React, { useState } from 'react';
import { Holding } from '../types/portfolio';
import { X, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/portfolioMath';

interface QuickTradeModalProps {
  isOpen: boolean;
  holding: Holding | null;
  onClose: () => void;
  onSave: (updated: Holding) => void;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  isOpen,
  holding,
  onClose,
  onSave
}) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [executionPrice, setExecutionPrice] = useState(
    holding ? holding.currentPrice.toString() : ''
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !holding) return null;

  const currentQty = holding.quantity;
  const currentCostBasis = holding.avgBuyPrice;
  const tradeQtyNum = parseFloat(tradeQuantity) || 0;
  const execPriceNum = parseFloat(executionPrice) || holding.currentPrice;

  // Calculate new position parameters
  let newQty = currentQty;
  let newAvgCost = currentCostBasis;

  if (tradeType === 'buy') {
    newQty = currentQty + tradeQtyNum;
    if (newQty > 0) {
      const existingTotalCost = currentQty * currentCostBasis;
      const additionalCost = tradeQtyNum * execPriceNum;
      newAvgCost = (existingTotalCost + additionalCost) / newQty;
    }
  } else {
    newQty = Math.max(0, currentQty - tradeQtyNum);
    // Cost basis per unit stays the same on sell/trim
    newAvgCost = currentCostBasis;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeQtyNum <= 0) {
      setError('Please enter a trade quantity greater than zero.');
      return;
    }
    if (tradeType === 'sell' && tradeQtyNum > currentQty) {
      setError(`Cannot sell more than current holding of ${currentQty} ${holding.symbol}.`);
      return;
    }
    if (execPriceNum < 0) {
      setError('Execution price cannot be negative.');
      return;
    }

    const updatedHolding: Holding = {
      ...holding,
      quantity: newQty,
      avgBuyPrice: newAvgCost,
      currentPrice: execPriceNum,
      lastUpdated: new Date().toISOString()
    };

    onSave(updatedHolding);
    setTradeQuantity('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">
              Adjust Position: <span className="font-mono text-emerald-400">{holding.symbol}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Current holding: {formatNumber(holding.quantity)} {holding.symbol} @ {formatCurrency(holding.avgBuyPrice)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Trade Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTradeType('buy');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                tradeType === 'buy'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Buy / Add More</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeType('sell');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                tradeType === 'sell'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Sell / Trim</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {tradeType === 'buy' ? 'Units to Buy' : 'Units to Sell'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder={`Quantity of ${holding.symbol}`}
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Execution Price ($ per unit)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Price executed at"
              value={executionPrice}
              onChange={(e) => setExecutionPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Trade Impact Preview */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
              Position After Trade
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>New Total Quantity:</span>
              <span className="font-bold text-white">
                {formatNumber(newQty, 6)} {holding.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>New Cost Basis:</span>
              <span className="font-bold text-emerald-400">
                {formatCurrency(newAvgCost)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Total Value at Exec Price:</span>
              <span className="text-slate-200">
                {formatCurrency(newQty * execPriceNum)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                tradeType === 'buy'
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
