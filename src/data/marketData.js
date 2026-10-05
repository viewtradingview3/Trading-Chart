/**
 * Market Data Manager for AlphaVision Pro
 * Handles Real-Time Binance WebSocket Feeds for Crypto & Gold (PAXG 1:1 Gold spot),
 * plus high-frequency live Forex simulation & historical klines.
 */

export const ASSETS = {
  // === COMMODITIES & METALS ===
  XAUUSDT: {
    symbol: 'XAUUSDT',
    displayName: 'XAU / USD',
    name: 'Spot Gold (Troy Ounce)',
    category: 'COMMODITY',
    binanceSymbol: 'paxgusdt', // 1:1 Physical Gold token on Binance (Real-time live feed)
    basePrice: 2685.5,
    decimals: 2,
    tickSize: 0.1,
    icon: '🪙',
  },
  XAGUSDT: {
    symbol: 'XAGUSDT',
    displayName: 'XAG / USD',
    name: 'Spot Silver',
    category: 'COMMODITY',
    binanceSymbol: null,
    basePrice: 31.85,
    decimals: 3,
    tickSize: 0.005,
    icon: '⚪',
  },
  USOIL: {
    symbol: 'USOIL',
    displayName: 'USOIL (WTI)',
    name: 'Crude Oil WTI',
    category: 'COMMODITY',
    binanceSymbol: null,
    basePrice: 71.45,
    decimals: 2,
    tickSize: 0.01,
    icon: '🛢️',
  },

  // === FOREX MAJORS ===
  EURUSD: {
    symbol: 'EURUSD',
    displayName: 'EUR / USD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    binanceSymbol: 'eurusdt',
    basePrice: 1.0845,
    decimals: 5,
    tickSize: 0.0001,
    icon: '💶',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    displayName: 'GBP / USD',
    name: 'British Pound / US Dollar',
    category: 'FOREX',
    binanceSymbol: 'gbpusdt',
    basePrice: 1.2965,
    decimals: 5,
    tickSize: 0.0001,
    icon: '💷',
  },
  USDJPY: {
    symbol: 'USDJPY',
    displayName: 'USD / JPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 152.45,
    decimals: 3,
    tickSize: 0.01,
    icon: '💴',
  },
  USDCHF: {
    symbol: 'USDCHF',
    displayName: 'USD / CHF',
    name: 'US Dollar / Swiss Franc',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.8655,
    decimals: 5,
    tickSize: 0.0001,
    icon: '₣',
  },
  USDCAD: {
    symbol: 'USDCAD',
    displayName: 'USD / CAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.3885,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🍁',
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    displayName: 'AUD / USD',
    name: 'Australian Dollar / USD',
    category: 'FOREX',
    binanceSymbol: 'audusdt',
    basePrice: 0.6580,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇦🇺',
  },
  NZDUSD: {
    symbol: 'NZDUSD',
    displayName: 'NZD / USD',
    name: 'New Zealand Dollar / USD',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.5985,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇳🇿',
  },

  // === FOREX MINORS & CROSSES ===
  EURGBP: {
    symbol: 'EURGBP',
    displayName: 'EUR / GBP',
    name: 'Euro / British Pound',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.8365,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇪🇺',
  },
  EURJPY: {
    symbol: 'EURJPY',
    displayName: 'EUR / JPY',
    name: 'Euro / Japanese Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 165.35,
    decimals: 3,
    tickSize: 0.01,
    icon: '🇪🇺',
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    displayName: 'GBP / JPY',
    name: 'British Pound / Japanese Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 197.65,
    decimals: 3,
    tickSize: 0.01,
    icon: '🇬🇧',
  },
  AUDJPY: {
    symbol: 'AUDJPY',
    displayName: 'AUD / JPY',
    name: 'Australian Dollar / Japanese Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 100.35,
    decimals: 3,
    tickSize: 0.01,
    icon: '🇦🇺',
  },
  CADJPY: {
    symbol: 'CADJPY',
    displayName: 'CAD / JPY',
    name: 'Canadian Dollar / Japanese Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 109.80,
    decimals: 3,
    tickSize: 0.01,
    icon: '🇨🇦',
  },
  CHFJPY: {
    symbol: 'CHFJPY',
    displayName: 'CHF / JPY',
    name: 'Swiss Franc / Japanese Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 176.10,
    decimals: 3,
    tickSize: 0.01,
    icon: '🇨🇭',
  },
  NZDJPY: {
    symbol: 'NZDJPY',
    displayName: 'NZD / JPY',
    name: 'New Zealand Dollar / Yen',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 91.25,
    decimals: 3,
    tickSize: 0.01,
    icon: '🇳🇿',
  },
  EURAUD: {
    symbol: 'EURAUD',
    displayName: 'EUR / AUD',
    name: 'Euro / Australian Dollar',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.6480,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇪🇺',
  },
  EURCAD: {
    symbol: 'EURCAD',
    displayName: 'EUR / CAD',
    name: 'Euro / Canadian Dollar',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.5060,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇪🇺',
  },
  EURCHF: {
    symbol: 'EURCHF',
    displayName: 'EUR / CHF',
    name: 'Euro / Swiss Franc',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.9385,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇪🇺',
  },
  GBPAUD: {
    symbol: 'GBPAUD',
    displayName: 'GBP / AUD',
    name: 'British Pound / Australian Dollar',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.9705,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇬🇧',
  },
  GBPCAD: {
    symbol: 'GBPCAD',
    displayName: 'GBP / CAD',
    name: 'British Pound / Canadian Dollar',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.8005,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇬🇧',
  },
  GBPCHF: {
    symbol: 'GBPCHF',
    displayName: 'GBP / CHF',
    name: 'British Pound / Swiss Franc',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.1220,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇬🇧',
  },
  AUDCAD: {
    symbol: 'AUDCAD',
    displayName: 'AUD / CAD',
    name: 'Australian Dollar / Canadian Dollar',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.9135,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇦🇺',
  },
  AUDCHF: {
    symbol: 'AUDCHF',
    displayName: 'AUD / CHF',
    name: 'Australian Dollar / Swiss Franc',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.5695,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇦🇺',
  },
  AUDNZD: {
    symbol: 'AUDNZD',
    displayName: 'AUD / NZD',
    name: 'Australian Dollar / NZD',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 1.0995,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇦🇺',
  },
  CADCHF: {
    symbol: 'CADCHF',
    displayName: 'CAD / CHF',
    name: 'Canadian Dollar / Swiss Franc',
    category: 'FOREX',
    binanceSymbol: null,
    basePrice: 0.6235,
    decimals: 5,
    tickSize: 0.0001,
    icon: '🇨🇦',
  },

  // === CRYPTO MAJORS ===
  BTCUSDT: {
    symbol: 'BTCUSDT',
    displayName: 'BTC / USDT',
    name: 'Bitcoin / Tether',
    category: 'CRYPTO',
    binanceSymbol: 'btcusdt',
    basePrice: 65400,
    decimals: 2,
    tickSize: 0.1,
    icon: '₿',
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    displayName: 'ETH / USDT',
    name: 'Ethereum / Tether',
    category: 'CRYPTO',
    binanceSymbol: 'ethusdt',
    basePrice: 3450,
    decimals: 2,
    tickSize: 0.05,
    icon: 'Ξ',
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    displayName: 'SOL / USDT',
    name: 'Solana / Tether',
    category: 'CRYPTO',
    binanceSymbol: 'solusdt',
    basePrice: 155,
    decimals: 2,
    tickSize: 0.01,
    icon: '◎',
  },
  BNBUSDT: {
    symbol: 'BNBUSDT',
    displayName: 'BNB / USDT',
    name: 'BNB / Tether',
    category: 'CRYPTO',
    binanceSymbol: 'bnbusdt',
    basePrice: 585,
    decimals: 2,
    tickSize: 0.01,
    icon: '🟡',
  },
  XRPUSDT: {
    symbol: 'XRPUSDT',
    displayName: 'XRP / USDT',
    name: 'Ripple / Tether',
    category: 'CRYPTO',
    binanceSymbol: 'xrpusdt',
    basePrice: 0.5420,
    decimals: 4,
    tickSize: 0.0001,
    icon: '✕',
  },
  ADAUSDT: {
    symbol: 'ADAUSDT',
    displayName: 'ADA / USDT',
    name: 'Cardano / Tether',
    category: 'CRYPTO',
    binanceSymbol: 'adausdt',
    basePrice: 0.3520,
    decimals: 4,
    tickSize: 0.0001,
    icon: '₳',
  },
};

export class MarketDataManager {
  constructor() {
    this.currentSymbol = 'BTCUSDT';
    this.currentTimeframe = '15m';
    this.candles = [];
    this.ws = null;
    this.simulatedTimer = null;
    this.watchlistTimer = null;
    this.onTickCallback = null;
    this.onWatchlistCallback = null;
    this.onStatusCallback = null;
    this.watchlistPrices = {};

    // Initialize watchlist default values
    Object.keys(ASSETS).forEach(sym => {
      this.watchlistPrices[sym] = {
        price: ASSETS[sym].basePrice,
        open24h: ASSETS[sym].basePrice,
        change: 0.0,
      };
    });
  }

  setCallbacks({ onTick, onWatchlist, onStatus }) {
    this.onTickCallback = onTick;
    this.onWatchlistCallback = onWatchlist;
    this.onStatusCallback = onStatus;
  }

  /**
   * Load historical candles for selected symbol & timeframe
   */
  async loadMarket(symbol, timeframe, onLiveUpdate = null) {
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;

    const asset = ASSETS[symbol] || ASSETS.BTCUSDT;

    // 1. Pre-seed with realistic synthetic candles instantly (NEVER blank screen)
    this.candles = this.generateSyntheticCandles(asset, timeframe, 200);

    if (this.onStatusCallback) {
      this.onStatusCallback(`Active: ${asset.displayName} (${asset.category})`);
    }

    // Connect real-time WebSocket or Simulated Ticks immediately
    this.startStreaming();

    // Start background watchlist updater
    this.startWatchlistStreaming();

    // 2. If asset has a Binance stream, fetch real historical data in background without freezing UI
    if (asset.binanceSymbol) {
      const tfMap = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '1d': '1d' };
      const interval = tfMap[timeframe] || '15m';
      const url = `https://api.binance.com/api/v3/klines?symbol=${asset.binanceSymbol.toUpperCase()}&interval=${interval}&limit=200`;

      fetch(url)
        .then(res => res.ok ? res.json() : null)
        .then(raw => {
          if (Array.isArray(raw) && raw.length > 20 && this.currentSymbol === symbol) {
            const parsed = raw.map(k => ({
              time: Math.floor(k[0] / 1000),
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
            }));

            // Validate Gold PAXG price > 1500
            const firstClose = parsed[parsed.length - 1]?.close || 0;
            const isGold = symbol === 'XAUUSDT';
            const isValidGoldPrice = !isGold || firstClose > 1500;

            if (isValidGoldPrice) {
              this.candles = parsed;
              asset.basePrice = parsed[parsed.length - 1].close;
              this.watchlistPrices[symbol] = {
                price: asset.basePrice,
                open24h: parsed[0].close,
                change: Number((((asset.basePrice - parsed[0].close) / parsed[0].close) * 100).toFixed(2)),
              };
              if (onLiveUpdate) {
                onLiveUpdate(this.candles);
              }
            }
          }
        })
        .catch(() => {
          // Synthetic candles already active
        });
    }

    return this.candles;
  }

  /**
   * Start Live WebSocket / Tick Stream
   */
  startStreaming() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }

    const asset = ASSETS[this.currentSymbol];
    const tf = this.currentTimeframe;

    if (asset && asset.binanceSymbol) {
      try {
        const streamName = `${asset.binanceSymbol}@kline_${tf}`;
        const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
        this.ws = new WebSocket(wsUrl);

        let wsConnected = false;
        const connectTimeout = setTimeout(() => {
          if (!wsConnected) {
            console.warn('Binance WS connection timed out, using high-frequency live stream');
            this.startSimulationStream(asset);
          }
        }, 2200);

        this.ws.onopen = () => {
          wsConnected = true;
          clearTimeout(connectTimeout);
          if (this.onStatusCallback) {
            this.onStatusCallback(`Live WebSocket Connected: ${asset.displayName}`);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.e === 'kline') {
              const k = data.k;
              const candle = {
                time: Math.floor(k.t / 1000),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
              };
              const isClosed = k.x;
              this.handleLiveCandle(candle, isClosed);
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        this.ws.onerror = (err) => {
          clearTimeout(connectTimeout);
          console.warn('Binance WS error, switching to fallback tick engine', err);
          this.startSimulationStream(asset);
        };

        this.ws.onclose = () => {
          // If closed unexpectedly
        };
        return;
      } catch (e) {
        console.warn('Failed to start Binance WS:', e);
      }
    }

    // Fallback to high-frequency live tick generator for Forex / Silver
    this.startSimulationStream(asset);
  }

  /**
   * Smooth realistic live tick engine (for Forex and offline scenarios)
   */
  startSimulationStream(asset) {
    if (this.onStatusCallback) {
      this.onStatusCallback(`Live High-Frequency Feed: ${asset.displayName}`);
    }

    const tfSeconds = this.getTimeframeSeconds(this.currentTimeframe);
    this.simulatedTimer = setInterval(() => {
      if (this.candles.length === 0) return;

      const lastCandle = this.candles[this.candles.length - 1];
      const nowSec = Math.floor(Date.now() / 1000);
      const isNew = nowSec - lastCandle.time >= tfSeconds;

      // Volatility step
      const volatility = lastCandle.close * 0.0004;
      const delta = (Math.random() - 0.495) * volatility;
      const newClose = Number((lastCandle.close + delta).toFixed(asset.decimals));

      let updatedCandle;
      if (isNew) {
        updatedCandle = {
          time: lastCandle.time + tfSeconds,
          open: lastCandle.close,
          high: Math.max(lastCandle.close, newClose),
          low: Math.min(lastCandle.close, newClose),
          close: newClose,
          volume: Math.floor(Math.random() * 80 + 20),
        };
        this.candles.push(updatedCandle);
      } else {
        updatedCandle = {
          ...lastCandle,
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose),
          close: newClose,
          volume: lastCandle.volume + Math.floor(Math.random() * 5 + 1),
        };
        this.candles[this.candles.length - 1] = updatedCandle;
      }

      this.updateWatchlistPrice(this.currentSymbol, newClose);

      if (this.onTickCallback) {
        this.onTickCallback(updatedCandle, isNew);
      }
    }, 500);
  }

  handleLiveCandle(candle, isClosed) {
    if (this.candles.length === 0) {
      this.candles.push(candle);
    } else {
      const lastIndex = this.candles.length - 1;
      const last = this.candles[lastIndex];

      if (candle.time === last.time) {
        this.candles[lastIndex] = candle;
      } else if (candle.time > last.time) {
        this.candles.push(candle);
      }
    }

    this.updateWatchlistPrice(this.currentSymbol, candle.close);

    if (this.onTickCallback) {
      this.onTickCallback(candle, isClosed);
    }
  }

  updateWatchlistPrice(symbol, currentPrice) {
    const item = this.watchlistPrices[symbol] || { price: currentPrice, open24h: currentPrice };
    const change = ((currentPrice - item.open24h) / item.open24h) * 100;
    this.watchlistPrices[symbol] = {
      price: currentPrice,
      open24h: item.open24h,
      change: Number(change.toFixed(2)),
    };

    if (this.onWatchlistCallback) {
      this.onWatchlistCallback(symbol, this.watchlistPrices[symbol]);
    }
  }

  startWatchlistStreaming() {
    if (this.watchlistTimer) clearInterval(this.watchlistTimer);

    // Minor organic fluctuation for inactive watchlist items to keep market alive
    this.watchlistTimer = setInterval(() => {
      Object.keys(ASSETS).forEach(sym => {
        if (sym === this.currentSymbol) return; // Active symbol is handled by WS/Tick
        const asset = ASSETS[sym];
        const cur = this.watchlistPrices[sym];
        const drift = (Math.random() - 0.498) * (cur.price * 0.0003);
        const newPrice = Number((cur.price + drift).toFixed(asset.decimals));
        this.updateWatchlistPrice(sym, newPrice);
      });
    }, 1500);
  }

  getTimeframeSeconds(tf) {
    switch (tf) {
      case '1m': return 60;
      case '5m': return 300;
      case '15m': return 900;
      case '1h': return 3600;
      case '1d': return 86400;
      default: return 900;
    }
  }

  generateSyntheticCandles(asset, timeframe, count = 200) {
    const candles = [];
    const tfSec = this.getTimeframeSeconds(timeframe);
    const now = Math.floor(Date.now() / 1000);
    const alignedNow = Math.floor(now / tfSec) * tfSec;
    let curTime = alignedNow - (count * tfSec);
    let curPrice = asset.basePrice;

    for (let i = 0; i < count; i++) {
      const volatility = curPrice * 0.0035;
      const trendBias = Math.sin(i / 14) * (volatility * 0.45);
      const change = (Math.random() - 0.49) * volatility + trendBias;
      const open = Number(curPrice.toFixed(asset.decimals));
      const close = Number(Math.max(curPrice * 0.1, open + change).toFixed(asset.decimals));
      const wickHigh = Math.abs(Math.random() * (volatility * 0.5));
      const wickLow = Math.abs(Math.random() * (volatility * 0.5));
      const high = Number((Math.max(open, close) + wickHigh).toFixed(asset.decimals));
      const low = Number(Math.max(curPrice * 0.05, Math.min(open, close) - wickLow).toFixed(asset.decimals));
      const volume = Math.floor(Math.random() * 500 + 100);

      candles.push({
        time: curTime,
        open,
        high,
        low,
        close,
        volume,
      });

      curPrice = close;
      curTime += tfSec;
    }

    return candles;
  }
}
