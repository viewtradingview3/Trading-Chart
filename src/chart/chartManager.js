/**
 * Chart Manager for AlphaVision Pro
 * Powered by TradingView Lightweight Charts v5
 * Features Candlesticks, Volume, EMA20/50, S/R Dynamic Price Lines, SMC Markers, and Sub-pane RSI
 */

import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  CrosshairMode,
  ColorType,
  createSeriesMarkers,
} from 'lightweight-charts';

export class ChartManager {
  constructor(mainContainerId, rsiContainerId) {
    this.mainContainer = document.getElementById(mainContainerId);
    this.rsiContainer = document.getElementById(rsiContainerId);

    this.mainChart = null;
    this.rsiChart = null;

    this.candleSeries = null;
    this.volumeSeries = null;
    this.ema20Series = null;
    this.ema50Series = null;
    this.rsiSeries = null;
    this.markerController = null;

    // Price lines
    this.supportLine = null;
    this.resistanceLine = null;
    this.entryLine = null;
    this.slLine = null;
    this.tp1Line = null;
    this.tp2Line = null;

    // Visibility toggles
    this.showSMC = true;
    this.showSR = true;
    this.showEMA = true;
    this.showRSI = true;
    this._lastCandles = null; // cache for toggle operations

    this.onCrosshairMoveCallback = null;
    this.initCharts();
    this.initResizeListener();
  }

  initCharts() {
    // 1. Initialize Main Chart Canvas
    this.mainChart = createChart(this.mainContainer, {
      width: this.mainContainer.clientWidth,
      height: this.mainContainer.clientHeight || 500,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#848e9c',
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.4)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(42, 46, 57, 0.4)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#758696', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#758696', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Candlestick Series
    this.candleSeries = this.mainChart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderUpColor: '#089981',
      borderDownColor: '#f23645',
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    // Volume Series (Overlay at bottom of chart)
    this.volumeSeries = this.mainChart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay without own scale
    });
    this.mainChart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // EMA 20 & 50 Line Series
    this.ema20Series = this.mainChart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      title: 'EMA 20',
    });

    this.ema50Series = this.mainChart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      title: 'EMA 50',
    });

    // 2. Initialize RSI Sub-chart Canvas
    this.rsiChart = createChart(this.rsiContainer, {
      width: this.rsiContainer.clientWidth,
      height: this.rsiContainer.clientHeight || 100,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#848e9c',
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: false,
      },
    });

    this.rsiSeries = this.rsiChart.addSeries(LineSeries, {
      color: '#c084fc',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    // RSI Overbought & Oversold horizontal guide lines
    this.rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(242, 54, 69, 0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OB 70',
    });
    this.rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(8, 153, 129, 0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OS 30',
    });

    // Crosshair listener
    this.mainChart.subscribeCrosshairMove((param) => {
      if (this.onCrosshairMoveCallback && param) {
        let priceData = null;
        if (param.seriesData && param.seriesData.get(this.candleSeries)) {
          priceData = param.seriesData.get(this.candleSeries);
        }
        this.onCrosshairMoveCallback(priceData);
      }
    });

    // Synchronize TimeScales between main and RSI subchart
    this.mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) {
        this.rsiChart.timeScale().setVisibleLogicalRange(range);
      }
    });
  }

  setCrosshairCallback(fn) {
    this.onCrosshairMoveCallback = fn;
  }

  /**
   * Set Candles & Indicators Data
   */
  setData(candles) {
    if (!candles || candles.length === 0) return;
    this._lastCandles = candles; // cache for indicator toggles

    // 1. Candlesticks
    const candleData = candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    this.candleSeries.setData(candleData);

    // 2. Volume Bars
    const volumeData = candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
    }));
    this.volumeSeries.setData(volumeData);

    // 3. EMA 20 & 50
    if (this.showEMA) {
      this.ema20Series.setData(this.calculateSeriesEMA(candles, 20));
      this.ema50Series.setData(this.calculateSeriesEMA(candles, 50));
    } else {
      this.ema20Series.setData([]);
      this.ema50Series.setData([]);
    }

    // 4. RSI
    if (this.showRSI) {
      this.rsiSeries.setData(this.calculateSeriesRSI(candles, 14));
    }

    // 5. Fit
    this.mainChart.timeScale().fitContent();
    this.rsiChart.timeScale().fitContent();
  }

  /**
   * Update real-time candle tick
   */
  updateTick(candle) {
    if (!candle) return;
    this.candleSeries.update({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });

    this.volumeSeries.update({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
    });
  }

  /**
   * Render Support and Resistance Price Lines
   */
  renderSRLevels(support, resistance) {
    if (this.supportLine) {
      this.candleSeries.removePriceLine(this.supportLine);
      this.supportLine = null;
    }
    if (this.resistanceLine) {
      this.candleSeries.removePriceLine(this.resistanceLine);
      this.resistanceLine = null;
    }

    if (!this.showSR || !support || !resistance) return;

    this.supportLine = this.candleSeries.createPriceLine({
      price: support,
      color: '#089981',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'KEY SUPPORT',
    });

    this.resistanceLine = this.candleSeries.createPriceLine({
      price: resistance,
      color: '#f23645',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'KEY RESISTANCE',
    });
  }

  /**
   * Render Trade Execution Target Lines (Entry, SL, TP1, TP2)
   */
  renderTradeLevels(levels, direction) {
    // Clean old lines
    if (this.entryLine) this.candleSeries.removePriceLine(this.entryLine);
    if (this.slLine) this.candleSeries.removePriceLine(this.slLine);
    if (this.tp1Line) this.candleSeries.removePriceLine(this.tp1Line);
    if (this.tp2Line) this.candleSeries.removePriceLine(this.tp2Line);

    if (!levels || direction === 'NEUTRAL') return;

    // Entry (Blue)
    this.entryLine = this.candleSeries.createPriceLine({
      price: levels.entry,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: 'ENTRY',
    });

    // Stop Loss (Red)
    this.slLine = this.candleSeries.createPriceLine({
      price: levels.sl,
      color: '#ef4444',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `SL (${levels.slPercent}%)`,
    });

    // TP 1 (Green Dashed)
    this.tp1Line = this.candleSeries.createPriceLine({
      price: levels.tp1,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `TP1 (${levels.tp1Percent}%)`,
    });

    // TP 2 (Green Solid)
    this.tp2Line = this.candleSeries.createPriceLine({
      price: levels.tp2,
      color: '#059669',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `TP2 (${levels.tp2Percent}%)`,
    });
  }

  /**
   * Set Markers for SMC Order Blocks, FVGs, and AI Buy/Sell Signals
   */
  renderMarkers(candles, aiAnalysis) {
    if (!this.showSMC || !candles || candles.length < 20) {
      if (this.markerController) this.markerController.setMarkers([]);
      return;
    }

    const markers = [];
    const n = candles.length;

    // 1. Historical pattern markers on chart
    for (let i = Math.max(0, n - 25); i < n - 1; i++) {
      const c = candles[i];
      const prev = candles[i - 1];
      const prev2 = candles[i - 2];

      // Bullish Hammer / Engulfing
      if (prev && c.close > c.open && (c.close - c.open) > (prev.open - prev.close) * 1.5 && prev.close < prev.open) {
        markers.push({
          time: c.time,
          position: 'belowBar',
          color: '#089981',
          shape: 'arrowUp',
          text: 'BULLISH REVERSAL',
        });
      }

      // Fair Value Gap (FVG)
      if (prev2 && prev && prev.low > prev2.high) {
        markers.push({
          time: c.time,
          position: 'aboveBar',
          color: '#a855f7',
          shape: 'circle',
          text: 'FVG',
        });
      }
    }

    // 2. Latest AI Signal Marker on Current Candle
    const latest = candles[n - 1];
    if (aiAnalysis && aiAnalysis.action === 'BUY') {
      markers.push({
        time: latest.time,
        position: 'belowBar',
        color: '#10b981',
        shape: 'arrowUp',
        text: `★ BUY SETUP (${aiAnalysis.tradeStyle})`,
      });
    } else if (aiAnalysis && aiAnalysis.action === 'SELL') {
      markers.push({
        time: latest.time,
        position: 'aboveBar',
        color: '#f87171',
        shape: 'arrowDown',
        text: `★ SELL SETUP (${aiAnalysis.tradeStyle})`,
      });
    } else if (aiAnalysis && aiAnalysis.action === 'CLOSE') {
      markers.push({
        time: latest.time,
        position: 'aboveBar',
        color: '#f59e0b',
        shape: 'square',
        text: '⚠️ CLOSE TRADE NOW',
      });
    }

    // CRITICAL: Sort markers ascending by time to prevent Lightweight Charts crash
    markers.sort((a, b) => a.time - b.time);

    // Set markers in Lightweight Charts v5 safely
    try {
      if (!this.markerController) {
        this.markerController = createSeriesMarkers(this.candleSeries, markers);
      } else {
        this.markerController.setMarkers(markers);
      }
    } catch (err) {
      console.warn('Marker rendering skipped safely:', err);
    }
  }

  // Toggle Features
  toggleSMC() {
    this.showSMC = !this.showSMC;
    return this.showSMC;
  }

  toggleSR() {
    this.showSR = !this.showSR;
    if (!this.showSR) {
      if (this.supportLine) this.candleSeries.removePriceLine(this.supportLine);
      if (this.resistanceLine) this.candleSeries.removePriceLine(this.resistanceLine);
      this.supportLine = null;
      this.resistanceLine = null;
    }
    return this.showSR;
  }

  toggleEMA() {
    this.showEMA = !this.showEMA;
    const candles = this._lastCandles;
    if (this.showEMA && candles) {
      this.ema20Series.setData(this.calculateSeriesEMA(candles, 20));
      this.ema50Series.setData(this.calculateSeriesEMA(candles, 50));
    } else {
      this.ema20Series.setData([]);
      this.ema50Series.setData([]);
    }
    return this.showEMA;
  }

  toggleRSI() {
    this.showRSI = !this.showRSI;
    // Use correct container ID from HTML
    const rsiContainer = document.getElementById('tv-rsi-container');
    const rsiDivider   = document.getElementById('tv-rsi-divider');
    if (rsiContainer) {
      rsiContainer.style.display = this.showRSI ? '' : 'none';
    }
    if (rsiDivider) {
      rsiDivider.style.display = this.showRSI ? '' : 'none';
    }
    if (this.showRSI && this._lastCandles) {
      this.rsiSeries.setData(this.calculateSeriesRSI(this._lastCandles, 14));
    }
    this.resizeCharts();
    return this.showRSI;
  }

  // --- Internal Indicators Series Builders ---

  calculateSeriesEMA(candles, period) {
    if (candles.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let ema = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;
    result.push({ time: candles[period - 1].time, value: ema });

    for (let i = period; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
      result.push({ time: candles[i].time, value: ema });
    }
    return result;
  }

  calculateSeriesRSI(candles, period = 14) {
    if (candles.length <= period) return [];
    const result = [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push({ time: candles[i].time, value: rsi });
    }
    return result;
  }

  initResizeListener() {
    const resizeObserver = new ResizeObserver(() => {
      this.resizeCharts();
    });
    if (this.mainContainer) resizeObserver.observe(this.mainContainer);
    window.addEventListener('resize', () => this.resizeCharts());
  }

  resizeCharts() {
    if (this.mainChart && this.mainContainer) {
      this.mainChart.applyOptions({
        width: this.mainContainer.clientWidth,
        height: this.mainContainer.clientHeight,
      });
    }
    if (this.rsiChart && this.rsiContainer) {
      this.rsiChart.applyOptions({
        width: this.rsiContainer.clientWidth,
        height: this.rsiContainer.clientHeight,
      });
    }
  }
}
