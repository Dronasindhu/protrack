import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Holding } from './types/portfolio';
import { storageService } from './services/storageService';
import { updateHoldingPrices } from './services/pricingService';
import { calculatePortfolioSummary } from './utils/portfolioMath';
import { Navbar } from './components/Navbar';
import { MetricsCards } from './components/MetricsCards';
import { Visualizations } from './components/Visualizations';
import { HoldingsTable } from './components/HoldingsTable';
import { AddAssetModal } from './components/AddAssetModal';
import { EditAssetModal } from './components/EditAssetModal';
import { QuickTradeModal } from './components/QuickTradeModal';
import { DataManagementModal } from './components/DataManagementModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [holdings, setHoldings] = useState<Holding[]>(() => storageService.loadHoldings());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => new Date().toISOString());
  const [liveCount, setLiveCount] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save to localStorage whenever holdings change
  useEffect(() => {
    storageService.saveHoldings(holdings);
  }, [holdings]);

  // Core pricing update function
  const refreshPrices = useCallback(async (currentList?: Holding[], showToast = true) => {
    const listToUpdate = currentList || holdings;
    if (listToUpdate.length === 0) return;

    setIsRefreshing(true);
    try {
      const result = await updateHoldingPrices(listToUpdate);
      setHoldings(result.updatedHoldings);
      setLiveCount(result.liveCount);
      const nowStr = new Date().toISOString();
      setLastUpdated(nowStr);
      storageService.setLastFetchTime(Date.now());

      if (showToast) {
        addToast('success', result.notice || 'Market prices updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update market prices', err);
      if (showToast) {
        addToast('error', 'Unable to fetch real-time quotes. Using cached prices.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [holdings, addToast]);

  // Automatic live price fetch upon loading
  useEffect(() => {
    const initialList = storageService.loadHoldings();
    if (initialList.length > 0) {
      refreshPrices(initialList, false);
    }
  }, []); // Run once on initial load

  // Summary Metrics
  const summary = useMemo(() => {
    return calculatePortfolioSummary(holdings);
  }, [holdings]);

  // Holding CRUD Handlers
  const handleAddHolding = (newHolding: Holding) => {
    const updated = [newHolding, ...holdings];
    setHoldings(updated);
    addToast('success', `Added ${newHolding.symbol} (${newHolding.name}) to portfolio.`);
    // Fetch price for the newly added item
    refreshPrices(updated, false);
  };

  const handleEditHolding = (updatedHolding: Holding) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === updatedHolding.id ? updatedHolding : h))
    );
    addToast('success', `Updated ${updatedHolding.symbol} position.`);
  };

  const handleDeleteHolding = (id: string, symbol: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
    addToast('info', `Removed ${symbol} from portfolio.`);
  };

  const handleOpenEdit = (holding: Holding) => {
    setSelectedHolding(holding);
    setIsEditModalOpen(true);
  };

  const handleOpenQuickTrade = (holding: Holding) => {
    setSelectedHolding(holding);
    setIsQuickTradeOpen(true);
  };

  const handleImportSuccess = (imported: Holding[]) => {
    setHoldings(imported);
    addToast('success', `Successfully imported ${imported.length} assets.`);
    refreshPrices(imported, true);
  };

  const handleResetToDemo = () => {
    const demo = storageService.resetToDefault();
    setHoldings(demo);
    addToast('info', 'Portfolio reset to sample holdings (NVDA, TSLA, BTC, ETH, SOL).');
    refreshPrices(demo, true);
  };

  const handleClearAll = () => {
    const empty = storageService.clearAllHoldings();
    setHoldings(empty);
    addToast('info', 'All portfolio holdings cleared.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar */}
      <Navbar
        onAddClick={() => setIsAddModalOpen(true)}
        onRefreshClick={() => refreshPrices(holdings, true)}
        onDataClick={() => setIsDataModalOpen(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        liveCount={liveCount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Breadcrumbs / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Portfolio Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live tracking and valuation for stocks, ETFs, and cryptocurrencies
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Local Storage Synced</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 font-mono">{holdings.length} Assets</span>
          </div>
        </div>

        {/* Portfolio Summary Metric Cards */}
        <MetricsCards
          summary={summary}
          totalAssetsCount={holdings.length}
        />

        {/* Visualizations Section (Asset Allocation Donut & Leaderboard) */}
        <Visualizations
          holdings={holdings}
          totalValue={summary.totalValue}
        />

        {/* Searchable, Sortable Holdings Table */}
        <HoldingsTable
          holdings={holdings}
          totalPortfolioValue={summary.totalValue}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteHolding}
          onQuickTrade={handleOpenQuickTrade}
        />
      </main>

      {/* Modals */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddHolding}
      />

      <EditAssetModal
        isOpen={isEditModalOpen}
        holding={selectedHolding}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedHolding(null);
        }}
        onSave={handleEditHolding}
      />

      <QuickTradeModal
        isOpen={isQuickTradeOpen}
        holding={selectedHolding}
        onClose={() => {
          setIsQuickTradeOpen(false);
          setSelectedHolding(null);
        }}
        onSave={handleEditHolding}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        holdings={holdings}
        onImportSuccess={handleImportSuccess}
        onResetToDemo={handleResetToDemo}
        onClearAll={handleClearAll}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Quiet, clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ProTrack</span>
            <span>·</span>
            <span>Real-time cryptocurrency & equity portfolio intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Free CoinGecko & Public Market Feeds</span>
            <span>·</span>
            <span>Data stored privately in browser</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
