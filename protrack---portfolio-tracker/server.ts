import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

interface PriceData {
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  source: 'live' | 'fallback';
}

// In-memory cache on server
const serverCache = new Map<string, { data: PriceData; timestamp: number }>();
const CACHE_TTL_MS = 15 * 1000; // 15 seconds cache

// Accurate 2026 fallback market prices if upstream is temporarily unreachable
const FALLBACK_PRICES: Record<string, { price: number; change24h: number; name?: string }> = {
  NVDA: { price: 233.95, change24h: 1.85, name: 'NVIDIA Corporation' },
  TSLA: { price: 370.59, change24h: -0.92, name: 'Tesla Inc.' },
  AMD: { price: 633.91, change24h: 2.14, name: 'Advanced Micro Devices' },
  AAPL: { price: 333.69, change24h: 0.65, name: 'Apple Inc.' },
  MSFT: { price: 517.53, change24h: 0.42, name: 'Microsoft Corporation' },
  AMZN: { price: 251.52, change24h: 1.15, name: 'Amazon.com Inc.' },
  GOOGL: { price: 341.86, change24h: 0.88, name: 'Alphabet Inc.' },
  META: { price: 727.52, change24h: 1.72, name: 'Meta Platforms Inc.' },
  PLTR: { price: 188.75, change24h: 3.45, name: 'Palantir Technologies' },
  SPY: { price: 615.40, change24h: 0.52, name: 'SPDR S&P 500 ETF' },
  QQQ: { price: 535.80, change24h: 0.74, name: 'Invesco QQQ Trust' },
  COIN: { price: 265.40, change24h: 2.80, name: 'Coinbase Global Inc.' },
  BTC: { price: 84550.0, change24h: 2.45, name: 'Bitcoin' },
  ETH: { price: 2662.0, change24h: 1.12, name: 'Ethereum' },
  SOL: { price: 118.4, change24h: 3.65, name: 'Solana' },
  BNB: { price: 585.0, change24h: 0.85, name: 'BNB' },
  XRP: { price: 0.585, change24h: -0.45, name: 'XRP' },
  DOGE: { price: 0.125, change24h: 1.95, name: 'Dogecoin' },
  AVAX: { price: 28.6, change24h: 2.10, name: 'Avalanche' },
  LINK: { price: 11.9, change24h: 1.30, name: 'Chainlink' }
};

/**
 * Fetch real-time stock quote from Yahoo Finance API via Node.js
 */
async function fetchStockQuote(symbol: string): Promise<PriceData> {
  const sym = symbol.toUpperCase().trim();
  const cacheKey = `stock_${sym}`;
  const cached = serverCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(4000)
      }
    );

    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change24h = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

        const result: PriceData = {
          price: Math.round(price * 100) / 100,
          change24h: Math.round(change24h * 100) / 100,
          high24h: meta.regularMarketDayHigh,
          low24h: meta.regularMarketDayLow,
          source: 'live'
        };

        serverCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err) {
    console.warn(`[Stock Fetch Error] ${sym}:`, err);
  }

  // Fallback to accurate baseline
  const fallback = FALLBACK_PRICES[sym] || { price: 100.0, change24h: 0.0 };
  const fallbackResult: PriceData = {
    price: fallback.price,
    change24h: fallback.change24h,
    source: 'fallback'
  };
  serverCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

/**
 * Fetch real-time crypto quote from Binance or CoinGecko via Node.js
 */
async function fetchCryptoQuote(symbol: string, coingeckoId?: string): Promise<PriceData> {
  const sym = symbol.toUpperCase().trim();
  const cacheKey = `crypto_${sym}`;
  const cached = serverCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Try Binance public ticker (super fast, ultra accurate real-time)
  try {
    const binancePair = `${sym}USDT`;
    const bRes = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binancePair}`,
      { signal: AbortSignal.timeout(3500) }
    );

    if (bRes.ok) {
      const bData = await bRes.json();
      const lastPrice = parseFloat(bData.lastPrice);
      const priceChangePercent = parseFloat(bData.priceChangePercent);

      if (!isNaN(lastPrice) && lastPrice > 0) {
        const result: PriceData = {
          price: lastPrice < 1 ? Math.round(lastPrice * 10000) / 10000 : Math.round(lastPrice * 100) / 100,
          change24h: Math.round(priceChangePercent * 100) / 100,
          high24h: parseFloat(bData.highPrice) || undefined,
          low24h: parseFloat(bData.lowPrice) || undefined,
          source: 'live'
        };

        serverCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch {
    // continue to CoinGecko
  }

  // 2. Try CoinGecko
  const cgId = coingeckoId || (sym === 'BTC' ? 'bitcoin' : sym === 'ETH' ? 'ethereum' : sym === 'SOL' ? 'solana' : sym.toLowerCase());
  try {
    const cgRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgId)}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000)
      }
    );

    if (cgRes.ok) {
      const cgData = await cgRes.json();
      if (cgData[cgId] && typeof cgData[cgId].usd === 'number') {
        const price = cgData[cgId].usd;
        const change = typeof cgData[cgId].usd_24h_change === 'number' ? cgData[cgId].usd_24h_change : 0;

        const result: PriceData = {
          price: price < 1 ? Math.round(price * 10000) / 10000 : Math.round(price * 100) / 100,
          change24h: Math.round(change * 100) / 100,
          source: 'live'
        };

        serverCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err) {
    console.warn(`[Crypto Fetch Error] ${sym}:`, err);
  }

  // Fallback to accurate baseline
  const fallback = FALLBACK_PRICES[sym] || { price: 50.0, change24h: 0.0 };
  const fallbackResult: PriceData = {
    price: fallback.price,
    change24h: fallback.change24h,
    source: 'fallback'
  };
  serverCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

// Batch price update endpoint
app.post('/api/prices', async (req, res) => {
  try {
    const { items } = req.body as {
      items: Array<{ symbol: string; type: 'stock' | 'crypto'; coingeckoId?: string }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ prices: {} });
    }

    const priceMap: Record<string, PriceData> = {};

    await Promise.all(
      items.map(async (item) => {
        const sym = item.symbol.toUpperCase().trim();
        if (item.type === 'crypto') {
          priceMap[sym] = await fetchCryptoQuote(sym, item.coingeckoId);
        } else {
          priceMap[sym] = await fetchStockQuote(sym);
        }
      })
    );

    res.json({ prices: priceMap });
  } catch (err: any) {
    console.error('Error handling /api/prices:', err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Single quote lookup endpoint
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const type = (req.query.type as string) === 'crypto' ? 'crypto' : 'stock';
    const coingeckoId = req.query.coingeckoId as string | undefined;

    let quote: PriceData;
    if (type === 'crypto') {
      quote = await fetchCryptoQuote(symbol, coingeckoId);
    } else {
      quote = await fetchStockQuote(symbol);
    }

    const name = FALLBACK_PRICES[symbol]?.name || symbol;

    res.json({
      symbol,
      name,
      ...quote
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Setup Vite middleware in dev or static files in production
async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProTrack server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
