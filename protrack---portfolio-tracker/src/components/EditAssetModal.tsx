import React, { useState, useEffect } from 'react';
import { Holding } from '../types/portfolio';
import { X } from 'lucide-react';
import { formatCurrency } from '../utils/portfolioMath';

interface EditAssetModalProps {
  isOpen: boolean;
  holding: Holding | null;
  onClose: () => void;
  onSave: (updated: Holding) => void;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  holding,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holding) {
      setName(holding.name);
      setQuantity(holding.quantity.toString());
      setAvgBuyPrice(holding.avgBuyPrice.toString());
      setCurrentPrice(holding.currentPrice.toString());
      setNotes(holding.notes || '');
      setError(null);
    }
  }, [holding]);

  if (!isOpen || !holding) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      setError('Quantity owned must be a non-negative number.');
      return;
    }
    const buyPrice = parseFloat(avgBuyPrice);
    if (isNaN(buyPrice) || buyPrice < 0) {
      setError('Average purchase price cannot be negative.');
      return;
    }
    const curPrice = parseFloat(currentPrice);
    if (isNaN(curPrice) || curPrice < 0) {
      setError('Current price cannot be negative.');
      return;
    }

    const updated: Holding = {
      ...holding,
      name: name.trim() || holding.symbol,
      quantity: qty,
      avgBuyPrice: buyPrice,
      currentPrice: curPrice,
      notes: notes.trim(),
      lastUpdated: new Date().toISOString()
    };

    onSave(updated);
    onClose();
  };

  const qtyNum = parseFloat(quantity) || 0;
  const buyNum = parseFloat(avgBuyPrice) || 0;
  const curNum = parseFloat(currentPrice) || 0;
  const totalCost = qtyNum * buyNum;
  const totalValue = qtyNum * curNum;
  const profitLoss = totalValue - totalCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
              {holding.symbol.slice(0, 3)}
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Edit {holding.symbol} Position
              </h2>
              <span className="text-xs text-slate-500 capitalize">{holding.type}</span>
            </div>
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

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Asset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Quantity Owned
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Avg Purchase Price ($)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Current Market Price ($)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Investment rationale, account notes, etc."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-hidden focus:border-slate-700"
            />
          </div>

          {/* Quick Real-Time Summary Calculation */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Total Cost Basis:</span>
              <span className="text-slate-200">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Market Value:</span>
              <span className="text-slate-200 font-bold">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Position Gain / Loss:</span>
              <span className={profitLoss >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
