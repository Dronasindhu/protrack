import { Holding } from '../types/portfolio';
import { INITIAL_HOLDINGS } from '../constants/presets';

const STORAGE_KEY = 'protrack_portfolio_holdings_v2';
const OLD_STORAGE_KEY = 'protrack_portfolio_holdings_v1';
const LAST_FETCH_KEY = 'protrack_last_price_fetch_v2';

export const storageService = {
  loadHoldings(): Holding[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Check for v1 migration
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        try {
          const oldParsed = JSON.parse(oldRaw);
          if (Array.isArray(oldParsed) && oldParsed.length > 0) {
            // Check if this was just the old initial holdings with stale prices
            const isOldDemo = oldParsed.some((h) => h.symbol === 'NVDA' && h.currentPrice < 150);
            if (isOldDemo && oldParsed.length <= 6) {
              this.saveHoldings(INITIAL_HOLDINGS);
              return INITIAL_HOLDINGS;
            }
            this.saveHoldings(oldParsed);
            return oldParsed;
          }
        } catch {
          // ignore
        }
      }

      // Default initial portfolio
      this.saveHoldings(INITIAL_HOLDINGS);
      return INITIAL_HOLDINGS;
    } catch (e) {
      console.error('Failed to load holdings from localStorage', e);
      return INITIAL_HOLDINGS;
    }
  },

  saveHoldings(holdings: Holding[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save holdings to localStorage', e);
    }
  },

  resetToDefault(): Holding[] {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HOLDINGS));
      return INITIAL_HOLDINGS;
    } catch (e) {
      console.error('Failed to reset holdings', e);
      return INITIAL_HOLDINGS;
    }
  },

  clearAllHoldings(): Holding[] {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    } catch (e) {
      console.error('Failed to clear holdings', e);
      return [];
    }
  },

  getLastFetchTime(): number | null {
    try {
      const raw = localStorage.getItem(LAST_FETCH_KEY);
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  },

  setLastFetchTime(time: number): void {
    try {
      localStorage.setItem(LAST_FETCH_KEY, time.toString());
    } catch (e) {
      console.error('Failed to set last fetch time', e);
    }
  },

  exportAsJSON(holdings: Holding[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(holdings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `protrack_portfolio_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportAsCSV(holdings: Holding[]): void {
    const headers = ['Symbol', 'Name', 'Type', 'Quantity', 'Avg Buy Price', 'Current Price', '24h Change (%)', 'Market Value', 'Total Return ($)', 'Total Return (%)', 'Notes'];
    const rows = holdings.map((h) => {
      const marketVal = h.quantity * h.currentPrice;
      const costBasis = h.quantity * h.avgBuyPrice;
      const profitLoss = marketVal - costBasis;
      const profitLossPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
      return [
        `"${h.symbol}"`,
        `"${h.name}"`,
        `"${h.type}"`,
        h.quantity,
        h.avgBuyPrice,
        h.currentPrice,
        h.change24h.toFixed(2),
        marketVal.toFixed(2),
        profitLoss.toFixed(2),
        profitLossPct.toFixed(2),
        `"${(h.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `protrack_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  parseImportJSON(jsonText: string): Holding[] {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: Expected a JSON array of holdings.');
    }
    // Validate each holding has basic fields
    const validated: Holding[] = parsed.map((item, idx) => {
      if (!item.symbol || typeof item.quantity !== 'number') {
        throw new Error(`Item at position ${idx + 1} is missing a valid symbol or quantity.`);
      }
      return {
        id: item.id || `hold_${Date.now()}_${idx}`,
        symbol: String(item.symbol).toUpperCase().trim(),
        name: String(item.name || item.symbol),
        type: item.type === 'crypto' ? 'crypto' : 'stock',
        quantity: Math.max(0, Number(item.quantity)),
        avgBuyPrice: Math.max(0, Number(item.avgBuyPrice || 0)),
        currentPrice: Math.max(0, Number(item.currentPrice || item.avgBuyPrice || 0)),
        change24h: Number(item.change24h || 0),
        notes: item.notes ? String(item.notes) : '',
        createdAt: item.createdAt || new Date().toISOString(),
        coingeckoId: item.coingeckoId
      };
    });
    return validated;
  }
};
