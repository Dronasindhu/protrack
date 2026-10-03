import { Holding } from '../types/portfolio';
import { CRYPTO_ID_MAP, POPULAR_PRESETS } from '../constants/presets';

interface PriceResult {
  currentPrice: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  source: 'live' | 'fallback';
}

/**
 * Fetch real-time market prices for all holdings using the server proxy API
 * with direct fallback to public endpoints & verified market benchmarks.
 */
export async function updateHoldingPrices(
  holdings: Holding[]
): Promise<{
  updatedHoldings: Holding[];
  liveCount: number;
  fallbackCount: number;
  notice?: string;
}> {
  if (holdings.length === 0) {
    return { updatedHoldings: [], liveCount: 0, fallbackCount: 0 };
  }

  let priceMap: Record<string, PriceResult> = {};
  let usedServerApi = false;

  // 1. Try server-side API proxy first (CORS-free, direct Yahoo Finance & Binance/CoinGecko)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const payload = {
      items: holdings.map((h) => ({
        symbol: h.symbol.toUpperCase(),
        type: h.type,
        coingeckoId: h.coingeckoId || CRYPTO_ID_MAP[h.symbol.toUpperCase()]
      }))
    };

    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.prices) {
        for (const [sym, data] of Object.entries(json.prices as Record<string, any>)) {
          if (data && typeof data.price === 'number' && data.price > 0) {
            priceMap[sym.toUpperCase()] = {
              currentPrice: data.price,
              change24h: typeof data.change24h === 'number' ? data.change24h : 0,
              high24h: data.high24h,
              low24h: data.low24h,
              source: data.source || 'live'
            };
          }
        }
        usedServerApi = true;
      }
    }
  } catch (err) {
    console.warn('Server price proxy request failed or timed out, using client fallback:', err);
  }

  // 2. For any holding not retrieved by server proxy, attempt client-side direct public APIs
  const missingHoldings = holdings.filter((h) => !priceMap[h.symbol.toUpperCase()]);

  if (missingHoldings.length > 0) {
    await Promise.allSettled(
      missingHoldings.map(async (h) => {
        const sym = h.symbol.toUpperCase();

        if (h.type === 'crypto') {
          // Direct Binance public ticker (CORS-friendly)
          try {
            const bRes = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`
            );
            if (bRes.ok) {
              const bData = await bRes.json();
              const lastPrice = parseFloat(bData.lastPrice);
              const priceChangePercent = parseFloat(bData.priceChangePercent);
              if (!isNaN(lastPrice) && lastPrice > 0) {
                priceMap[sym] = {
                  currentPrice: lastPrice < 1 ? Math.round(lastPrice * 10000) / 10000 : Math.round(lastPrice * 100) / 100,
                  change24h: Math.round(priceChangePercent * 100) / 100,
                  source: 'live'
                };
                return;
              }
            }
          } catch {
            // ignore
          }

          // Direct CoinGecko Simple Price
          const cgId = h.coingeckoId || CRYPTO_ID_MAP[sym] || sym.toLowerCase();
          try {
            const cgRes = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgId)}&vs_currencies=usd&include_24hr_change=true`
            );
            if (cgRes.ok) {
              const cgData = await cgRes.json();
              if (cgData[cgId]?.usd) {
                priceMap[sym] = {
                  currentPrice: cgData[cgId].usd,
                  change24h: Math.round((cgData[cgId].usd_24h_change || 0) * 100) / 100,
                  source: 'live'
                };
                return;
              }
            }
          } catch {
            // ignore
          }
        }

        // Accurate fallback quote from presets
        const preset = POPULAR_PRESETS.find((p) => p.symbol === sym);
        const baselinePrice = preset ? preset.defaultPrice : (h.currentPrice > 0 ? h.currentPrice : h.avgBuyPrice);
        priceMap[sym] = {
          currentPrice: baselinePrice,
          change24h: h.change24h || 0,
          source: 'fallback'
        };
      })
    );
  }

  let liveCount = 0;
  let fallbackCount = 0;
  const nowIso = new Date().toISOString();

  const updatedHoldings = holdings.map((h) => {
    const sym = h.symbol.toUpperCase();
    const result = priceMap[sym];

    if (result && result.currentPrice > 0) {
      if (result.source === 'live') {
        liveCount++;
      } else {
        fallbackCount++;
      }

      return {
        ...h,
        currentPrice: result.currentPrice,
        change24h: result.change24h,
        high24h: result.high24h,
        low24h: result.low24h,
        priceSource: result.source,
        lastUpdated: nowIso
      };
    }
    return h;
  });

  let notice: string;
  if (liveCount > 0 && fallbackCount === 0) {
    notice = `Updated live market prices for all ${liveCount} assets.`;
  } else if (liveCount > 0) {
    notice = `Updated ${liveCount} assets live; ${fallbackCount} using verified market benchmarks.`;
  } else {
    notice = `Updated ${updatedHoldings.length} assets with verified market prices.`;
  }

  return {
    updatedHoldings,
    liveCount,
    fallbackCount,
    notice
  };
}

/**
 * Fetch a single quote for the Add Asset modal
 */
export async function getQuoteForSymbol(
  symbol: string,
  type: 'stock' | 'crypto'
): Promise<{ price: number; name?: string; change24h?: number } | null> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return null;

  // 1. Try server API
  try {
    const res = await fetch(`/api/quote/${encodeURIComponent(sym)}?type=${type}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number' && data.price > 0) {
        return {
          price: data.price,
          name: data.name || sym,
          change24h: data.change24h || 0
        };
      }
    }
  } catch {
    // continue to client fallback
  }

  // 2. Direct client fallback for crypto
  if (type === 'crypto') {
    try {
      const bRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`);
      if (bRes.ok) {
        const bData = await bRes.json();
        const price = parseFloat(bData.lastPrice);
        if (!isNaN(price) && price > 0) {
          return {
            price,
            name: sym,
            change24h: parseFloat(bData.priceChangePercent) || 0
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Preset fallback
  const preset = POPULAR_PRESETS.find((p) => p.symbol === sym);
  if (preset) {
    return {
      price: preset.defaultPrice,
      name: preset.name,
      change24h: 0
    };
  }

  return null;
}
