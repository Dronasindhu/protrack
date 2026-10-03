import React from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  Database,
  Clock,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onAddClick: () => void;
  onRefreshClick: () => void;
  onDataClick: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
  liveCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddClick,
  onRefreshClick,
  onDataClick,
  isRefreshing,
  lastUpdated,
  liveCount
}) => {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'Just now';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/10">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              Pro<span className="text-emerald-400">Track</span>
            </span>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-500 tracking-wide">
              Portfolio
            </span>
          </div>
        </div>

        {/* Zone 2: Live status info */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRefreshing ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRefreshing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-slate-300 font-medium">
              {isRefreshing ? 'Updating Market Quotes...' : 'Market Live'}
            </span>
          </div>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated {formatTime(lastUpdated)}</span>
          </div>
          {liveCount > 0 && (
            <>
              <span className="text-slate-700" aria-hidden="true">·</span>
              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                CoinGecko & Stock Feeds
              </span>
            </>
          )}
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onRefreshClick}
            disabled={isRefreshing}
            title="Refresh real-time prices"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Prices</span>
          </button>

          <button
            onClick={onDataClick}
            title="Data Management (Export, Import, Reset)"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Data</span>
          </button>

          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
