import React, { useState } from 'react';
import { AssetType, Holding } from '../types/portfolio';
import { POPULAR_PRESETS, CRYPTO_ID_MAP } from '../constants/presets';
import { getQuoteForSymbol } from '../services/pricingService';
import { X, Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/portfolioMath';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (holding: Holding) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('stock');
  const [quantity, setQuantity] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceFetchedNotice, setPriceFetchedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = async (preset: typeof POPULAR_PRESETS[0]) => {
    setSymbol(preset.symbol);
    setName(preset.name);
    setType(preset.type);
    setCurrentPrice(preset.defaultPrice.toString());
    setAvgBuyPrice(preset.defaultPrice.toString());
    setError(null);
    setPriceFetchedNotice(`Default quote: ${formatCurrency(preset.defaultPrice)}`);

    // Fetch live quote in background
    setIsFetchingPrice(true);
    try {
      const quote = await getQuoteForSymbol(preset.symbol, preset.type);
      if (quote) {
        setCurrentPrice(quote.price.toString());
        setPriceFetchedNotice(`Live quote: ${formatCurrency(quote.price)}`);
      }
    } catch {
      // keep default
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleFetchQuote = async () => {
    if (!symbol.trim()) {
      setError('Please enter a ticker symbol first.');
      return;
    }
    setError(null);
    setIsFetchingPrice(true);
    try {
      const quote = await getQuoteForSymbol(symbol, type);
      if (quote) {
        setCurrentPrice(quote.price.toString());
        if (!name) setName(quote.name || symbol.toUpperCase());
        if (!avgBuyPrice) setAvgBuyPrice(quote.price.toString());
        setPriceFetchedNotice(`Live quote: ${formatCurrency(quote.price)}`);
      } else {
        setPriceFetchedNotice('No live quote found. Please enter current price manually.');
      }
    } catch {
      setPriceFetchedNotice('Unable to fetch quote right now. Enter price manually.');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = symbol.toUpperCase().trim();
    if (!sym) {
      setError('Ticker symbol is required.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity owned must be a positive number.');
      return;
    }
    const buyPrice = parseFloat(avgBuyPrice);
    if (isNaN(buyPrice) || buyPrice < 0) {
      setError('Average purchase price cannot be negative.');
      return;
    }
    const curPrice = parseFloat(currentPrice) || buyPrice;

    const newHolding: Holding = {
      id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      symbol: sym,
      name: name.trim() || sym,
      type,
      quantity: qty,
      avgBuyPrice: buyPrice,
      currentPrice: curPrice,
      change24h: 0,
      createdAt: new Date().toISOString(),
      notes: notes.trim(),
      coingeckoId: type === 'crypto' ? CRYPTO_ID_MAP[sym] || sym.toLowerCase() : undefined,
      priceSource: 'live'
    };

    onAdd(newHolding);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSymbol('');
    setName('');
    setType('stock');
    setQuantity('');
    setAvgBuyPrice('');
    setCurrentPrice('');
    setNotes('');
    setError(null);
    setPriceFetchedNotice(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Add Holding</h2>
            <p className="text-xs text-slate-400">Track a new stock or cryptocurrency asset</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Popular Presets (1-Click Select)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_PRESETS.slice(0, 10).map((preset) => (
                <button
                  type="button"
                  key={preset.symbol}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono border transition-colors ${
                    symbol === preset.symbol
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Type Toggle */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Asset Category
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setType('stock')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  type === 'stock'
                    ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stock / Equity
              </button>
              <button
                type="button"
                onClick={() => setType('crypto')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  type === 'crypto'
                    ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cryptocurrency
              </button>
            </div>
          </div>

          {/* Symbol and Fetch Button */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Ticker Symbol *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. NVDA, BTC, TSLA"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleFetchQuote}
                disabled={isFetchingPrice || !symbol.trim()}
                className="w-full py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                {isFetchingPrice ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Fetch Quote</span>
              </button>
            </div>
          </div>

          {priceFetchedNotice && (
            <div className="text-[11px] text-emerald-400/90 font-mono">
              {priceFetchedNotice}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Asset Name
            </label>
            <input
              type="text"
              placeholder="e.g. NVIDIA Corporation, Bitcoin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Quantity & Buy Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Quantity Owned *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 10 or 0.25"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Avg Purchase Price ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Cost basis per unit"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Current Price */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Current Market Price ($)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Will update automatically via live feed"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono tabular-nums placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Long-term DCA, cold storage, tech growth"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-hidden focus:border-slate-700"
            />
          </div>

          {/* Cost preview if filled */}
          {parseFloat(quantity) > 0 && parseFloat(avgBuyPrice) > 0 && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex justify-between text-slate-400 font-mono">
              <span>Total Cost Basis:</span>
              <strong className="text-white">
                {formatCurrency(parseFloat(quantity) * parseFloat(avgBuyPrice))}
              </strong>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors"
            >
              Add to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
