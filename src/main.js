/**
 * AlphaVision Pro — Main Application
 * TradingView-exact UI wiring with AI, Charts, Paper Trading
 */

import { MarketDataManager, ASSETS } from './data/marketData.js';
import { ChartManager } from './chart/chartManager.js';
import { TradingAIEngine } from './ai/tradingEngine.js';
import { AudioAlerts } from './components/audioAlerts.js';
import { PaperTrader } from './components/paperTrader.js';
import { AuthManager } from './auth/authManager.js';

class App {
  constructor() {
    this.currentSymbol    = 'BTCUSDT';
    this.currentTimeframe = '15m';
    this.currentStrategy  = 'ALL';
    this.currentView      = 'terminal';
    this.manualOrderDir   = 'BUY';
    this.isScanning       = false;
    this.lastActionState  = null;
    this.cachedAnalysis   = null;
    this.currentDDFilter  = 'ALL';
    this.currentWLFilter  = 'ALL';

    this.marketData  = new MarketDataManager();
    this.chartManager= new ChartManager('tv-main-chart', 'tv-rsi-chart');
    this.aiEngine    = new TradingAIEngine();
    this.audioAlerts = new AudioAlerts();
    this.paperTrader = new PaperTrader();
    this.authManager = new AuthManager();

    this.init();
  }

  async init() {
    this.bindDOMEvents();
    this.setupSymbolDropdownUI('ALL', '');
    this.setupWatchlistUI('ALL');
    this.startClock();

    // Wire Paper Trader callbacks
    this.paperTrader.setCallbacks({
      onUpdate: (data) => this.renderPaperTradingUI(data),
      onCloseAlert: (pos) => {
        this.audioAlerts.playCloseAlert();
        this.showQuickBanner('⚠️ TRADE CLOSE KR DO!', `Position ${pos.symbol} reached Target 1 (+${pos.pnlPercent}%)`);
      },
    });

    // Wire Market Data callbacks
    this.marketData.setCallbacks({
      onTick:      (candle, isClosed) => this.handleMarketTick(candle, isClosed),
      onWatchlist: (symbol, data)     => this.handleWatchlistUpdate(symbol, data),
      onStatus:    (status)           => this.updateStatus(status),
    });

    // Crosshair legend updater
    this.chartManager.setCrosshairCallback((priceData) => this.updateLegend(priceData));

    // Start with terminal
    this.switchView('terminal');
    await this.loadMarket(this.currentSymbol, this.currentTimeframe);

    setTimeout(() => this.chartManager.resizeCharts(), 100);
  }

  /* ──────────────────────────────────────────────────────────
   *  VIEW SWITCHING
   * ────────────────────────────────────────────────────────── */
  switchView(viewName) {
    this.currentView = viewName;
    const landingView  = document.getElementById('view-landing');
    const terminalView = document.getElementById('view-terminal');

    if (viewName === 'terminal') {
      if (landingView)  landingView.classList.add('hidden');
      if (terminalView) terminalView.classList.remove('hidden');
      setTimeout(() => this.chartManager.resizeCharts(), 50);
    } else {
      if (landingView)  landingView.classList.remove('hidden');
      if (terminalView) terminalView.classList.add('hidden');
    }
  }

  /* ──────────────────────────────────────────────────────────
   *  LOAD MARKET
   * ────────────────────────────────────────────────────────── */
  async loadMarket(symbol, timeframe) {
    this.currentSymbol    = symbol;
    this.currentTimeframe = timeframe;
    const asset = ASSETS[symbol] || ASSETS.BTCUSDT;

    // Update header symbol display
    const symText  = document.getElementById('current-symbol-text');
    const mktText  = document.getElementById('current-market-text');
    const legSym   = document.getElementById('legend-symbol');
    const legTf    = document.getElementById('legend-tf');
    const aiSym    = document.getElementById('ai-sym-badge');

    if (symText)  symText.textContent  = asset.displayName;
    if (mktText)  mktText.textContent  = asset.category;
    if (legSym)   legSym.textContent   = asset.displayName;
    if (legTf)    legTf.textContent    = timeframe;
    if (aiSym)    aiSym.textContent    = asset.displayName;

    // Highlight active in dropdown & watchlist
    document.querySelectorAll('.dropdown-item').forEach(el => {
      el.classList.toggle('active', el.dataset.symbol === symbol);
    });
    document.querySelectorAll('.wl-item').forEach(el => {
      el.classList.toggle('active', el.dataset.symbol === symbol);
    });

    // Timeframe active state
    document.querySelectorAll('.tv-tf-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tf === timeframe);
    });

    // Fetch candles
    const candles = await this.marketData.loadMarket(symbol, timeframe, (freshCandles) => {
      this.chartManager.setData(freshCandles);
      this.runAIAnalysis(freshCandles);
    });
    this.chartManager.setData(candles);
    this.runAIAnalysis(candles);
  }

  /* ──────────────────────────────────────────────────────────
   *  REAL-TIME TICK
   * ────────────────────────────────────────────────────────── */
  handleMarketTick(candle, isClosed) {
    this.chartManager.updateTick(candle);

    const asset    = ASSETS[this.currentSymbol];
    const priceEl  = document.getElementById('header-price');
    const changeEl = document.getElementById('header-change');

    if (priceEl) priceEl.textContent = candle.close.toFixed(asset.decimals);

    const wlItem = this.marketData.watchlistPrices[this.currentSymbol];
    if (wlItem && changeEl) {
      changeEl.textContent = `${wlItem.change >= 0 ? '+' : ''}${wlItem.change.toFixed(2)}%`;
      changeEl.style.color = wlItem.change >= 0 ? 'var(--tv-green)' : 'var(--tv-red)';
    }

    this.paperTrader.updateMarketPrice(this.currentSymbol, candle.close);
    if (isClosed) this.runAIAnalysis(this.marketData.candles);
  }

  /* ──────────────────────────────────────────────────────────
   *  AI ANALYSIS
   * ────────────────────────────────────────────────────────── */
  runAIAnalysis(candles, forceUpdate = false) {
    if (!candles || candles.length === 0) return;

    const activePos = this.paperTrader.getActivePositionForSymbol(this.currentSymbol);
    this.aiEngine.setActiveTradeState(activePos);

    if (forceUpdate) this.lastActionState = null;

    const analysis = this.aiEngine.analyze(candles, this.currentStrategy, this.currentTimeframe);
    this.cachedAnalysis = analysis;

    // Chart visuals
    this.chartManager.renderSRLevels(analysis.sr.support, analysis.sr.resistance);
    this.chartManager.renderTradeLevels(analysis.levels, analysis.direction);
    this.chartManager.renderMarkers(candles, analysis);

    // ── AI Card flash
    const card = document.getElementById('ai-action-box');
    if (card) {
      card.classList.remove('just-updated');
      void card.offsetWidth;
      card.classList.add('just-updated');
      setTimeout(() => card.classList.remove('just-updated'), 500);
    }

    // ── Action title
    const titleEl     = document.getElementById('action-title');
    const subtitleEl  = document.getElementById('action-subtitle');
    const confEl      = document.getElementById('ai-confidence');
    const confBar     = document.getElementById('confidence-bar');
    const reasoningEl = document.getElementById('ai-reasoning-text');
    const styleEl     = document.getElementById('ai-trade-style');
    const rrEl        = document.getElementById('ai-rr-ratio');
    const scanSpeed   = document.getElementById('scan-speed-val');
    const aiBadge     = document.getElementById('header-ai-signal');
    const aiText      = document.getElementById('header-ai-text');
    const botPill     = document.getElementById('bot-alert-pill');
    const botText     = document.getElementById('bot-alert-text');

    if (scanSpeed) scanSpeed.textContent = `${analysis.scanTimeMs || 0.8}ms`;

    if (titleEl)    { titleEl.textContent = analysis.actionTitle;    titleEl.className = `tv-ai-action ${analysis.action}`; }
    if (subtitleEl) subtitleEl.textContent = analysis.actionSubtitle;
    if (confEl)     confEl.textContent    = `${analysis.confidence}%`;
    if (confBar)    confBar.style.width   = `${analysis.confidence}%`;
    if (reasoningEl)reasoningEl.textContent = analysis.urduReasoning;
    if (styleEl)    styleEl.textContent   = analysis.tradeStyle;
    if (rrEl)       rrEl.textContent      = analysis.levels.rrRatio;

    // AI Badge in header
    if (aiBadge && aiText) {
      aiBadge.className = 'tv-ai-badge';
      if (analysis.action === 'BUY' || analysis.action === 'STRONG_BUY') {
        aiBadge.classList.add('buy');
        aiText.textContent = `🟢 BUY — ${analysis.tradeStyle}`;
        if (this.lastActionState !== 'BUY') {
          this.audioAlerts.playBuyAlert();
          this.showQuickBanner('🟢 AB TRADE LY LO (BUY)', analysis.urduReasoning);
        }
      } else if (analysis.action === 'SELL' || analysis.action === 'STRONG_SELL') {
        aiBadge.classList.add('sell');
        aiText.textContent = `🔴 SELL — ${analysis.tradeStyle}`;
        if (this.lastActionState !== 'SELL') {
          this.audioAlerts.playSellAlert();
          this.showQuickBanner('🔴 AB TRADE LY LO (SELL)', analysis.urduReasoning);
        }
      } else {
        aiText.textContent = 'SCANNING…';
      }
    }

    // Bot pill
    if (botPill && botText) {
      if (analysis.action === 'BUY' || analysis.action === 'STRONG_BUY') {
        botPill.classList.remove('hidden', 'sell-alert');
        botText.textContent = `AI: BUY Setup — ${analysis.tradeStyle}`;
      } else if (analysis.action === 'SELL' || analysis.action === 'STRONG_SELL') {
        botPill.classList.remove('hidden');
        botPill.classList.add('sell-alert');
        botText.textContent = `AI: SELL Setup — ${analysis.tradeStyle}`;
      } else {
        botPill.classList.add('hidden');
      }
    }

    this.lastActionState = analysis.action;

    // Trade levels
    const decimals = ASSETS[this.currentSymbol].decimals;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('ai-entry', analysis.levels.entry ? analysis.levels.entry.toFixed(decimals) : '—');
    setEl('ai-sl',    analysis.levels.sl    ? analysis.levels.sl.toFixed(decimals)    : '—');
    setEl('ai-tp1',   analysis.levels.tp1   ? analysis.levels.tp1.toFixed(decimals)   : '—');
    setEl('ai-tp2',   analysis.levels.tp2   ? analysis.levels.tp2.toFixed(decimals)   : '—');
  }

  /* ──────────────────────────────────────────────────────────
   *  CROSSHAIR LEGEND
   * ────────────────────────────────────────────────────────── */
  updateLegend(priceData) {
    if (!priceData) return;
    const decimals = ASSETS[this.currentSymbol].decimals;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('legend-open',  priceData.open  ? priceData.open.toFixed(decimals)  : '—');
    setEl('legend-high',  priceData.high  ? priceData.high.toFixed(decimals)  : '—');
    setEl('legend-low',   priceData.low   ? priceData.low.toFixed(decimals)   : '—');
    setEl('legend-close', priceData.close ? priceData.close.toFixed(decimals) : '—');

    const diffEl = document.getElementById('legend-change');
    if (diffEl && priceData.open && priceData.close) {
      const diff    = priceData.close - priceData.open;
      const diffPct = ((diff / priceData.open) * 100).toFixed(2);
      diffEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(decimals)} (${diffPct}%)`;
      diffEl.style.color = diff >= 0 ? 'var(--tv-green)' : 'var(--tv-red)';
    }
  }

  /* ──────────────────────────────────────────────────────────
   *  SYMBOL DROPDOWN UI
   * ────────────────────────────────────────────────────────── */
  setupSymbolDropdownUI(filterCategory = 'ALL', searchQuery = '') {
    const container = document.getElementById('symbol-dd-list');
    if (!container) return;
    container.innerHTML = '';
    const query = searchQuery.trim().toLowerCase();

    Object.keys(ASSETS).forEach(sym => {
      const asset = ASSETS[sym];
      if (filterCategory !== 'ALL' && asset.category !== filterCategory) return;
      if (query && !asset.displayName.toLowerCase().includes(query) && !asset.name.toLowerCase().includes(query)) return;

      const wlData = this.marketData.watchlistPrices[sym];
      const price  = wlData ? wlData.price  : asset.basePrice;
      const change = wlData ? wlData.change : 0;

      const item = document.createElement('div');
      item.className = `dropdown-item${sym === this.currentSymbol ? ' active' : ''}`;
      item.dataset.symbol = sym;
      item.innerHTML = `
        <div class="dd-item-left">
          <span class="dd-item-sym">${asset.icon || '•'} ${asset.displayName}</span>
          <span class="dd-item-name">${asset.name}</span>
        </div>
        <div class="dd-item-right">
          <span class="dd-item-price">${price.toFixed(asset.decimals)}</span>
          <span class="dd-item-chg ${change >= 0 ? 'up' : 'down'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>
        </div>
      `;
      item.addEventListener('click', () => {
        document.getElementById('symbol-dropdown').classList.add('hidden');
        this.loadMarket(sym, this.currentTimeframe);
      });
      container.appendChild(item);
    });

    if (container.children.length === 0) {
      container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--tv-text-2);font-size:12px;">No results</div>`;
    }
  }

  /* ──────────────────────────────────────────────────────────
   *  WATCHLIST UI
   * ────────────────────────────────────────────────────────── */
  setupWatchlistUI(filterCategory = 'ALL') {
    this.currentWLFilter = filterCategory;
    const container = document.getElementById('watchlist-container');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(ASSETS).forEach(sym => {
      const asset = ASSETS[sym];
      if (filterCategory !== 'ALL' && asset.category !== filterCategory) return;

      const div = document.createElement('div');
      div.className = `wl-item${sym === this.currentSymbol ? ' active' : ''}`;
      div.dataset.symbol = sym;
      div.innerHTML = `
        <div class="wl-left">
          <span class="wl-sym">${asset.icon || ''} ${asset.displayName}</span>
          <span class="wl-name">${asset.name}</span>
        </div>
        <div class="wl-right">
          <span class="wl-price" id="wl-price-${sym}">—</span>
          <span class="wl-chg" id="wl-chg-${sym}">0.00%</span>
        </div>
      `;
      div.addEventListener('click', () => this.loadMarket(sym, this.currentTimeframe));
      container.appendChild(div);

      const cached = this.marketData.watchlistPrices[sym];
      if (cached) this.handleWatchlistUpdate(sym, cached);
    });
  }

  handleWatchlistUpdate(symbol, data) {
    const priceEl  = document.getElementById(`wl-price-${symbol}`);
    const changeEl = document.getElementById(`wl-chg-${symbol}`);
    if (priceEl && changeEl) {
      const asset = ASSETS[symbol];
      priceEl.textContent  = data.price.toFixed(asset.decimals);
      changeEl.textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
      changeEl.className   = `wl-chg ${data.change >= 0 ? 'up' : 'down'}`;
    }
  }

  /* ──────────────────────────────────────────────────────────
   *  PAPER TRADING UI
   * ────────────────────────────────────────────────────────── */
  renderPaperTradingUI(data) {
    const balEl  = document.getElementById('pt-balance');
    const pnlEl  = document.getElementById('pt-pnl');
    const wlEl   = document.getElementById('pt-wl');
    const listEl = document.getElementById('pt-positions-list');

    if (balEl) balEl.textContent = `$${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (pnlEl) {
      const pnl = data.totalPnl || 0;
      pnlEl.textContent = `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}`;
      pnlEl.style.color = pnl >= 0 ? 'var(--tv-green)' : 'var(--tv-red)';
    }
    if (wlEl) wlEl.textContent = `${data.wins || 0} / ${data.losses || 0}`;

    if (!listEl) return;
    if (!data.positions || data.positions.length === 0) {
      listEl.innerHTML = `<div class="tv-pt-empty">No open positions</div>`;
      return;
    }
    listEl.innerHTML = '';
    data.positions.forEach(pos => {
      const card = document.createElement('div');
      card.className = 'pt-pos-card';
      const isProfit = pos.pnl >= 0;
      const decimals = ASSETS[pos.symbol] ? ASSETS[pos.symbol].decimals : 2;
      card.innerHTML = `
        <div class="pos-top">
          <span class="pos-sym">${pos.symbol}</span>
          <span class="pos-dir ${pos.direction.toLowerCase()}">${pos.direction}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tv-text-2);margin-bottom:6px;">
          <span>Entry: ${pos.entryPrice.toFixed(decimals)}</span>
          <span>Mark: ${(pos.currentPrice || pos.entryPrice).toFixed(decimals)}</span>
        </div>
        <div class="pos-pnl ${isProfit ? 'pos' : 'neg'}">${isProfit ? '+' : ''}$${pos.pnl.toFixed(2)} (${isProfit ? '+' : ''}${pos.pnlPercent}%)</div>
        <button class="pos-close-btn" data-id="${pos.id}">Close Position</button>
      `;
      card.querySelector('.pos-close-btn').addEventListener('click', () => this.paperTrader.closePosition(pos.id));
      listEl.appendChild(card);
    });
  }

  /* ──────────────────────────────────────────────────────────
   *  QUICK BANNER
   * ────────────────────────────────────────────────────────── */
  showQuickBanner(title, body) {
    const banner  = document.getElementById('quick-banner');
    const titleEl = document.getElementById('banner-title');
    const bodyEl  = document.getElementById('banner-body');
    if (!banner) return;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl)  bodyEl.textContent  = body;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 6000);
  }

  /* ──────────────────────────────────────────────────────────
   *  STATUS + CLOCK
   * ────────────────────────────────────────────────────────── */
  updateStatus(status) {
    const el   = document.getElementById('status-text');
    const dot  = document.getElementById('conn-dot');
    if (el)  el.textContent = status;
    if (dot) {
      dot.className = 'tv-status-conn';
      if (status.toLowerCase().includes('live') || status.toLowerCase().includes('connected')) {
        dot.classList.add('connected');
      } else if (status.toLowerCase().includes('error') || status.toLowerCase().includes('fail')) {
        dot.classList.add('error');
      }
    }
  }

  startClock() {
    const tick = () => {
      const el = document.getElementById('live-clock');
      if (el) el.textContent = new Date().toUTCString().slice(17, 25) + ' UTC';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ──────────────────────────────────────────────────────────
   *  BIND ALL DOM EVENTS
   * ────────────────────────────────────────────────────────── */
  bindDOMEvents() {

    // ── LANDING nav
    const safe = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

    safe('btn-go-landing',   () => this.switchView('landing'));
    safe('btn-hero-launch',  () => this.switchView('terminal'));
    safe('btn-landing-login', () => {
      const o = document.getElementById('auth-modal-overlay');
      const fl = document.getElementById('form-login');
      const fs = document.getElementById('form-signup');
      if (o)  o.classList.remove('hidden');
      if (fl) fl.classList.remove('hidden');
      if (fs) fs.classList.add('hidden');
      const tl = document.getElementById('tab-login'); const ts = document.getElementById('tab-signup');
      if (tl) tl.classList.add('active'); if (ts) ts.classList.remove('active');
    });
    safe('btn-landing-signup', () => {
      const o = document.getElementById('auth-modal-overlay');
      const fl = document.getElementById('form-login');
      const fs = document.getElementById('form-signup');
      if (o)  o.classList.remove('hidden');
      if (fl) fl.classList.add('hidden');
      if (fs) fs.classList.remove('hidden');
      const tl = document.getElementById('tab-login'); const ts = document.getElementById('tab-signup');
      if (tl) tl.classList.remove('active'); if (ts) ts.classList.add('active');
    });
    safe('auth-modal-close', () => {
      const o = document.getElementById('auth-modal-overlay');
      if (o) o.classList.add('hidden');
    });
    safe('tab-login', () => {
      document.getElementById('form-login')?.classList.remove('hidden');
      document.getElementById('form-signup')?.classList.add('hidden');
      document.getElementById('tab-login')?.classList.add('active');
      document.getElementById('tab-signup')?.classList.remove('active');
    });
    safe('tab-signup', () => {
      document.getElementById('form-signup')?.classList.remove('hidden');
      document.getElementById('form-login')?.classList.add('hidden');
      document.getElementById('tab-signup')?.classList.add('active');
      document.getElementById('tab-login')?.classList.remove('active');
    });
    safe('switch-to-signup', (e) => { e?.preventDefault(); document.getElementById('tab-signup')?.click(); });
    safe('switch-to-login',  (e) => { e?.preventDefault(); document.getElementById('tab-login')?.click(); });

    // Auth modal overlay click to close
    document.getElementById('auth-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('auth-modal-overlay')) {
        document.getElementById('auth-modal-overlay').classList.add('hidden');
      }
    });

    // Auth forms
    safe('btn-auth-login', () => {
      const email = document.getElementById('login-email')?.value;
      const pass  = document.getElementById('login-password')?.value;
      if (email && pass) {
        const res = this.authManager.login(email, pass);
        if (res.success) {
          document.getElementById('auth-modal-overlay')?.classList.add('hidden');
          this.switchView('terminal');
        }
      }
    });
    safe('btn-auth-signup', () => {
      const name  = document.getElementById('signup-name')?.value;
      const email = document.getElementById('signup-email')?.value;
      const pass  = document.getElementById('signup-password')?.value;
      if (email && pass) {
        const res = this.authManager.signup(name || 'User', email, pass);
        if (res.success) {
          document.getElementById('auth-modal-overlay')?.classList.add('hidden');
          this.switchView('terminal');
        }
      }
    });

    // ── SYMBOL DROPDOWN
    const symbolBtn  = document.getElementById('symbol-search-trigger');
    const symbolDD   = document.getElementById('symbol-dropdown');
    const searchInp  = document.getElementById('symbol-dd-search');

    if (symbolBtn && symbolDD) {
      symbolBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        symbolDD.classList.toggle('hidden');
        if (!symbolDD.classList.contains('hidden') && searchInp) searchInp.focus();
      });
      symbolDD.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => symbolDD?.classList.add('hidden'));
    }

    if (searchInp) {
      searchInp.addEventListener('input', (e) => this.setupSymbolDropdownUI(this.currentDDFilter, e.target.value));
    }

    // DD category tabs
    document.querySelectorAll('.tv-dd-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tv-dd-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentDDFilter = tab.dataset.filter;
        this.setupSymbolDropdownUI(this.currentDDFilter, searchInp?.value || '');
      });
    });

    // ── TIMEFRAMES
    document.querySelectorAll('.tv-tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tv-tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadMarket(this.currentSymbol, btn.dataset.tf);
      });
    });

    // ── WATCHLIST FILTER TABS
    document.querySelectorAll('.tv-wl-ftab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tv-wl-ftab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setupWatchlistUI(tab.dataset.wlfilter);
      });
    });

    // ── PANEL TABS (Watchlist / AI / Trade)
    document.querySelectorAll('.tv-panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tv-panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tv-panel-body').forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        const panelId = `panel-${tab.dataset.panel}`;
        document.getElementById(panelId)?.classList.remove('hidden');
      });
    });

    // ── STRATEGY TABS
    document.querySelectorAll('.tv-strat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tv-strat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentStrategy = tab.dataset.strategy;
        this.runAIAnalysis(this.marketData.candles);
      });
    });

    // ── RESCAN BUTTON
    safe('btn-rescan', () => {
      if (this.isScanning) return;
      this.isScanning = true;
      this.audioAlerts.init();
      const btn = document.getElementById('btn-rescan');
      if (btn) { btn.classList.add('scanning'); btn.disabled = true; }
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.runAIAnalysis(this.marketData.candles, true);
          if (btn) { btn.classList.remove('scanning'); btn.disabled = false; }
          this.isScanning = false;
        }, 80);
      });
    });

    // ── SOUND TOGGLE
    safe('sound-btn', () => {
      const enabled = this.audioAlerts.toggleSound();
      const btn = document.getElementById('sound-btn');
      if (btn) btn.style.opacity = enabled ? '1' : '0.4';
    });

    // ── PAPER TRADING — Manual order direction
    safe('btn-manual-buy', () => {
      this.manualOrderDir = 'BUY';
      document.getElementById('btn-manual-buy')?.classList.add('active');
      document.getElementById('btn-manual-sell')?.classList.remove('active');
    });
    safe('btn-manual-sell', () => {
      this.manualOrderDir = 'SELL';
      document.getElementById('btn-manual-sell')?.classList.add('active');
      document.getElementById('btn-manual-buy')?.classList.remove('active');
    });

    // ── PLACE ORDER
    safe('btn-place-order', () => {
      const riskPct = parseFloat(document.getElementById('pt-risk-pct')?.value) || 2;
      const candle  = this.marketData.candles[this.marketData.candles.length - 1];
      if (!candle) return;
      this.paperTrader.openPosition({
        symbol:     this.currentSymbol,
        direction:  this.manualOrderDir,
        entryPrice: candle.close,
        amount:     this.paperTrader.balance * (riskPct / 100),
        leverage:   10,
        sl:  this.cachedAnalysis?.levels?.sl,
        tp1: this.cachedAnalysis?.levels?.tp1,
        tp2: this.cachedAnalysis?.levels?.tp2,
      });
    });

    // ── CLOSE ALL
    safe('btn-close-all', () => {
      this.paperTrader.closeAllPositions?.();
      this.renderPaperTradingUI(this.paperTrader.getState());
    });

    // ── BANNER CLOSE
    safe('banner-close', () => document.getElementById('quick-banner')?.classList.add('hidden'));

    // ── INDICATORS DROPDOWN
    const indBtn = document.getElementById('btn-indicators');
    const indDD  = document.getElementById('indicators-dropdown');
    if (indBtn && indDD) {
      indBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        indDD.classList.toggle('hidden');
      });
      indDD.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => indDD?.classList.add('hidden'));
    }

    // Helper: toggle indicator button state
    const toggleInd = (id, fn) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const isOn = fn(); // call chartManager toggle, returns new state
        btn.classList.toggle('active', isOn);
        btn.textContent = isOn ? 'ON' : 'OFF';
      });
    };

    toggleInd('toggle-ema',    () => this.chartManager.toggleEMA());
    toggleInd('toggle-rsi',    () => this.chartManager.toggleRSI());
    toggleInd('toggle-sr',     () => {
      const on = this.chartManager.toggleSR();
      if (on && this.cachedAnalysis) {
        this.chartManager.renderSRLevels(this.cachedAnalysis.sr.support, this.cachedAnalysis.sr.resistance);
      }
      return on;
    });
    toggleInd('toggle-smc',    () => {
      const on = this.chartManager.toggleSMC();
      this.chartManager.renderMarkers(this.marketData.candles, this.cachedAnalysis);
      return on;
    });
    toggleInd('toggle-levels', () => {
      // Toggle trade levels visibility
      if (this.chartManager._showLevels === undefined) this.chartManager._showLevels = true;
      this.chartManager._showLevels = !this.chartManager._showLevels;
      if (this.chartManager._showLevels && this.cachedAnalysis) {
        this.chartManager.renderTradeLevels(this.cachedAnalysis.levels, this.cachedAnalysis.direction);
      } else {
        // Remove lines by calling with null levels
        if (this.chartManager.entryLine) this.chartManager.candleSeries.removePriceLine(this.chartManager.entryLine);
        if (this.chartManager.slLine)    this.chartManager.candleSeries.removePriceLine(this.chartManager.slLine);
        if (this.chartManager.tp1Line)   this.chartManager.candleSeries.removePriceLine(this.chartManager.tp1Line);
        if (this.chartManager.tp2Line)   this.chartManager.candleSeries.removePriceLine(this.chartManager.tp2Line);
        this.chartManager.entryLine = null;
        this.chartManager.slLine    = null;
        this.chartManager.tp1Line   = null;
        this.chartManager.tp2Line   = null;
      }
      return this.chartManager._showLevels;
    });

    // ── TOOLBAR TOOLS (visual active state)
    document.querySelectorAll('.tv-tool-btn').forEach(btn => {
      if (btn.id === 'tool-clear') return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tv-tool-btn').forEach(b => {
          if (b.id !== 'tool-clear') b.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => new App());
