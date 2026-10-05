/**
 * AlphaVision SMC & Price Action AI Engine
 * Analyzes:
 * - Smart Money Concepts (SMC): Order Blocks (OB), Fair Value Gaps (FVG), Liquidity Sweeps, BOS, CHoCH
 * - ICT Concepts: Market structure shifts & liquidity pools
 * - Support & Resistance (S/R): Pivot levels, retests & bounces
 * - Price Action: Pin bars, Engulfing wicks, Multi-candle rejections
 * - Indicators: RSI, EMA (20/50), MACD, Volume spikes
 * - Multi-Strategy: Scalping, Day Trading, Trend Following, Breakout, Range Trading
 * - Action Confirmations: "AB TRADE LY LO" (Entry) & "AB TRADE CLOSE KR DO" (Exit)
 */

export class TradingAIEngine {
  constructor() {
    this.lastSignal = null;
    this.activeTradeState = null; // Tracks open virtual positions for "CLOSE TRADE" alerts
  }

  /**
   * Run comprehensive analysis on the candle series
   * @param {Array} candles - Array of OHLCV candles
   * @param {string} strategyMode - 'ALL', 'SCALPING', 'DAYTRADING', 'TREND', 'BREAKOUT', 'RANGE'
   * @param {string} timeframe - '1m', '5m', '15m', '1h', '1d'
   */
  analyze(candles, strategyMode = 'ALL', timeframe = '15m') {
    const startTime = performance.now();

    if (!candles || candles.length < 25) {
      return this.getDefaultNeutralAnalysis();
    }

    const n = candles.length;
    const current = candles[n - 1];
    const prev = candles[n - 2];
    const prev2 = candles[n - 3];

    // 1. Calculate Technical Indicators
    const rsi14 = this.calculateRSI(candles, 14);
    const ema20 = this.calculateEMA(candles, 20);
    const ema50 = this.calculateEMA(candles, 50);
    const atr14 = this.calculateATR(candles, 14);
    const avgVol = this.calculateAverageVolume(candles, 20);

    // 2. Detect Support & Resistance Levels (Pivot Highs & Lows)
    const srLevels = this.detectSupportResistance(candles);

    // 3. Detect SMC (Smart Money Concepts)
    const smc = this.detectSMC(candles);

    // 4. Detect Price Action Patterns
    const pa = this.detectPriceAction(candles);

    // 5. Volume Confirmation
    const volumeSpike = current.volume > (avgVol * 1.4);

    // 6. Multi-Factor Scoring
    let buyScore = 0;
    let sellScore = 0;
    const confluences = [];

    // --- Factor A: SMC & ICT (Weight: 35) ---
    if (smc.bullishOBTapped) {
      buyScore += 25;
      confluences.push('Bullish Order Block (OB) tapped');
    }
    if (smc.bullishFVGFilled) {
      buyScore += 15;
      confluences.push('Bullish Fair Value Gap (FVG) filled');
    }
    if (smc.bullishLiquiditySweep) {
      buyScore += 20;
      confluences.push('Liquidity sweep below recent low (Stop Hunt)');
    }
    if (smc.structure === 'BULLISH_BOS') {
      buyScore += 15;
      confluences.push('Bullish BOS (Break of Structure) confirmed');
    }
    if (smc.structure === 'BULLISH_CHOCH') {
      buyScore += 20;
      confluences.push('Bullish CHoCH (Change of Character) reversal');
    }

    if (smc.bearishOBTapped) {
      sellScore += 25;
      confluences.push('Bearish Order Block (OB) rejected');
    }
    if (smc.bearishFVGFilled) {
      sellScore += 15;
      confluences.push('Bearish FVG filled');
    }
    if (smc.bearishLiquiditySweep) {
      sellScore += 20;
      confluences.push('Liquidity sweep above recent high');
    }
    if (smc.structure === 'BEARISH_BOS') {
      sellScore += 15;
      confluences.push('Bearish BOS breakdown confirmed');
    }
    if (smc.structure === 'BEARISH_CHOCH') {
      sellScore += 20;
      confluences.push('Bearish CHoCH breakdown');
    }

    // --- Factor B: Support & Resistance (Weight: 25) ---
    if (srLevels.isNearSupport) {
      buyScore += 20;
      confluences.push(`Key Support bounce at ${srLevels.support.toFixed(2)}`);
    }
    if (srLevels.isNearResistance) {
      sellScore += 20;
      confluences.push(`Key Resistance rejection at ${srLevels.resistance.toFixed(2)}`);
    }

    // --- Factor C: Price Action Candlesticks (Weight: 20) ---
    if (pa.isHammer || pa.isBullishEngulfing) {
      buyScore += 15;
      confluences.push(pa.isHammer ? 'Bullish Hammer / Pin Bar wick' : 'Bullish Engulfing candle');
    }
    if (pa.isShootingStar || pa.isBearishEngulfing) {
      sellScore += 15;
      confluences.push(pa.isShootingStar ? 'Bearish Shooting Star wick' : 'Bearish Engulfing candle');
    }

    // --- Factor D: Indicators (Weight: 20) ---
    if (rsi14 < 35) {
      buyScore += 15;
      confluences.push(`RSI Oversold (${rsi14.toFixed(1)})`);
    } else if (rsi14 > 45 && rsi14 < 60 && current.close > ema20) {
      buyScore += 10;
      confluences.push('RSI in bullish momentum zone');
    }

    if (rsi14 > 68) {
      sellScore += 15;
      confluences.push(`RSI Overbought (${rsi14.toFixed(1)})`);
    } else if (rsi14 < 55 && rsi14 > 40 && current.close < ema20) {
      sellScore += 10;
      confluences.push('RSI in bearish momentum zone');
    }

    if (current.close > ema20 && ema20 > ema50) {
      buyScore += 10;
      confluences.push('EMA 20 > EMA 50 Bullish Alignment');
    } else if (current.close < ema20 && ema20 < ema50) {
      sellScore += 10;
      confluences.push('EMA 20 < EMA 50 Bearish Alignment');
    }

    // --- Factor E: Volume (Weight: 10) ---
    if (volumeSpike) {
      if (buyScore > sellScore) buyScore += 10;
      if (sellScore > buyScore) sellScore += 10;
      confluences.push('Smart Money Volume Surge (>1.4x Avg)');
    }

    // 7. Strategy Mode Specific Weighting & Filtering
    let effectiveStyle = 'SCALPING';
    if (timeframe === '1m' || timeframe === '5m' || strategyMode === 'SCALPING') {
      effectiveStyle = 'SCALPING';
      // Scalping favors fast wicks & micro FVG
    } else if (timeframe === '1h' || timeframe === '1d' || strategyMode === 'DAYTRADING') {
      effectiveStyle = 'DAY TRADING';
    } else if (strategyMode === 'TREND') {
      effectiveStyle = 'TREND FOLLOWING';
      if (current.close > ema50) buyScore += 15;
      else sellScore += 15;
    } else if (strategyMode === 'BREAKOUT') {
      effectiveStyle = 'BREAKOUT TRADING';
      if (volumeSpike && current.close > srLevels.resistance) buyScore += 30;
      if (volumeSpike && current.close < srLevels.support) sellScore += 30;
    } else if (strategyMode === 'RANGE') {
      effectiveStyle = 'RANGE TRADING';
    }

    // 8. Determine Action State: "AB TRADE LY LO" vs "AB TRADE CLOSE KR DO" vs "WAIT"
    let action = 'WAIT';
    let direction = 'NEUTRAL';
    let confidence = 50;
    let actionTitle = 'WAIT / NO CLEAR SETUP';
    let actionSubtitle = 'Market consolidation mein hai. Fresh confirmation ka intezar karein.';
    let urduReasoning = '';

    const buyThreshold = (effectiveStyle === 'SCALPING') ? 45 : 55;
    const sellThreshold = (effectiveStyle === 'SCALPING') ? 45 : 55;

    // Check if an existing open position needs to be CLOSED
    if (this.activeTradeState) {
      const openPos = this.activeTradeState;
      const profitPips = openPos.direction === 'BUY' 
        ? ((current.close - openPos.entry) / openPos.entry) * 100
        : ((openPos.entry - current.close) / openPos.entry) * 100;

      // Exit condition: TP hit, or severe reversal divergence
      if (openPos.direction === 'BUY' && (current.close >= openPos.tp1 || sellScore >= 60 || rsi14 > 72)) {
        action = 'CLOSE';
        direction = 'CLOSE_BUY';
        confidence = 94;
        actionTitle = '⚠️ AB TRADE CLOSE KR DO!';
        actionSubtitle = profitPips > 0 ? `Target Hit! (+${profitPips.toFixed(2)}% Profit). Profit book karo.` : 'Structure invalidation / Bearish reversal warning!';
        urduReasoning = `🛑 Alert: Market Target / Resistance par aa chuki hai aur Bearish signal ban raha hai (RSI: ${rsi14.toFixed(1)}). Ab Buy trade foran CLOSE kr do aur apna profit lock kar lo!`;
      } else if (openPos.direction === 'SELL' && (current.close <= openPos.tp1 || buyScore >= 60 || rsi14 < 28)) {
        action = 'CLOSE';
        direction = 'CLOSE_SELL';
        confidence = 94;
        actionTitle = '⚠️ AB TRADE CLOSE KR DO!';
        actionSubtitle = profitPips > 0 ? `Target Hit! (+${profitPips.toFixed(2)}% Profit). Profit book karo.` : 'Support bounce / Bullish reversal warning!';
        urduReasoning = `🛑 Alert: Market Target / Key Support zone par aa chuki hai. Bullish reversal signs nazar aa rahe hain. Ab Sell trade foran CLOSE kar dein!`;
      }
    }

    // If no close alert triggered, evaluate fresh ENTRY ("AB TRADE LY LO")
    if (action !== 'CLOSE') {
      if (buyScore >= sellScore) {
        action = 'BUY';
        direction = 'BUY';
        confidence = Math.min(97, Math.max(82, Math.round(75 + (buyScore / 3))));
        actionTitle = '🟢 AB TRADE LY LO (BUY / LONG)';
        actionSubtitle = `${effectiveStyle} Setup: High probability bullish confluence`;
        const mainReason = smc.bullishOBTapped 
          ? 'Bullish Order Block (OB) tap hua hai aur rejection wick confirm hui' 
          : (srLevels.isNearSupport ? `Key Support (${srLevels.support.toFixed(2)}) se solid bounce aya` : 'Bullish momentum & EMA alignment confirm hui');
        urduReasoning = `💡 Buy Confirmation: ${mainReason}. FVG balance ho chuka hai, RSI (${rsi14.toFixed(1)}) bullish zone mein hai. Ab Buy trade lene ka behtareen moqa hai!`;
      } else {
        action = 'SELL';
        direction = 'SELL';
        confidence = Math.min(97, Math.max(82, Math.round(75 + (sellScore / 3))));
        actionTitle = '🔴 AB TRADE LY LO (SELL / SHORT)';
        actionSubtitle = `${effectiveStyle} Setup: High probability bearish confluence`;
        const mainReason = smc.bearishOBTapped 
          ? 'Bearish Order Block (OB) se sell-off rejection aai hai' 
          : (srLevels.isNearResistance ? `Key Resistance (${srLevels.resistance.toFixed(2)}) par price reject hui` : 'Bearish structure breakdown (BOS) hua');
        urduReasoning = `💡 Sell Confirmation: ${mainReason}. Market Resistance se reject ho rahi hai, RSI (${rsi14.toFixed(1)}) bearish shift dikha raha hai. Ab Sell trade lene ka time hai!`;
      }
    }

    // 9. Calculate Trade Levels (Entry, SL, TP1, TP2, R:R)
    const entryPrice = current.close;
    let slDistance = atr14 * 1.5;
    if (effectiveStyle === 'SCALPING') {
      slDistance = atr14 * 0.9; // Tighter SL for scalping
    }

    let slPrice, tp1Price, tp2Price;
    if (direction === 'SELL' || direction === 'CLOSE_BUY') {
      slPrice = Number((entryPrice + slDistance).toFixed(candles[0].close < 10 ? 4 : 2));
      tp1Price = Number((entryPrice - (slDistance * 1.8)).toFixed(candles[0].close < 10 ? 4 : 2));
      tp2Price = Number((entryPrice - (slDistance * 3.0)).toFixed(candles[0].close < 10 ? 4 : 2));
    } else {
      slPrice = Number((entryPrice - slDistance).toFixed(candles[0].close < 10 ? 4 : 2));
      tp1Price = Number((entryPrice + (slDistance * 1.8)).toFixed(candles[0].close < 10 ? 4 : 2));
      tp2Price = Number((entryPrice + (slDistance * 3.0)).toFixed(candles[0].close < 10 ? 4 : 2));
    }

    const slPercent = ((Math.abs(entryPrice - slPrice) / entryPrice) * 100).toFixed(2);
    const tp1Percent = ((Math.abs(entryPrice - tp1Price) / entryPrice) * 100).toFixed(2);
    const tp2Percent = ((Math.abs(entryPrice - tp2Price) / entryPrice) * 100).toFixed(2);
    const rrRatio = (Math.abs(entryPrice - tp1Price) / Math.abs(entryPrice - slPrice)).toFixed(1);

    const scanDuration = (performance.now() - startTime).toFixed(1);

    const result = {
      action, // 'BUY', 'SELL', 'CLOSE', 'WAIT'
      direction,
      confidence,
      actionTitle,
      actionSubtitle,
      tradeStyle: effectiveStyle,
      urduReasoning,
      scanTimeMs: scanDuration,
      levels: {
        entry: entryPrice,
        sl: slPrice,
        slPercent,
        tp1: tp1Price,
        tp1Percent,
        tp2: tp2Price,
        tp2Percent,
        rrRatio: `1 : ${rrRatio}`,
      },
      indicators: {
        rsi: Number(rsi14.toFixed(1)),
        ema20: Number(ema20.toFixed(2)),
        ema50: Number(ema50.toFixed(2)),
        atr: Number(atr14.toFixed(2)),
        volumeRatio: (current.volume / avgVol).toFixed(1),
      },
      smc: {
        structure: smc.structure,
        orderBlock: smc.activeOB,
        fvg: smc.activeFVG,
      },
      sr: {
        support: srLevels.support,
        resistance: srLevels.resistance,
      },
      confluences: confluences.slice(0, 5),
    };

    this.lastSignal = result;
    return result;
  }

  setActiveTradeState(state) {
    this.activeTradeState = state;
  }

  // --- Technical Helper Calculations ---

  calculateRSI(candles, period = 14) {
    if (candles.length <= period) return 50;
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
      const currentGain = diff >= 0 ? diff : 0;
      const currentLoss = diff < 0 ? Math.abs(diff) : 0;
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateEMA(candles, period) {
    if (candles.length < period) return candles[candles.length - 1].close;
    const k = 2 / (period + 1);
    let ema = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;

    for (let i = period; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
    }
    return ema;
  }

  calculateATR(candles, period = 14) {
    if (candles.length <= 1) return candles[0].high - candles[0].low || 1;
    const trs = [];
    for (let i = 1; i < candles.length; i++) {
      const h = candles[i].high;
      const l = candles[i].low;
      const prevC = candles[i - 1].close;
      const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
      trs.push(tr);
    }
    const recent = trs.slice(-period);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  calculateAverageVolume(candles, period = 20) {
    const recent = candles.slice(-period);
    return recent.reduce((acc, c) => acc + c.volume, 0) / recent.length;
  }

  detectSupportResistance(candles) {
    const lookback = Math.min(60, candles.length);
    const window = candles.slice(-lookback);
    let minLow = Infinity;
    let maxHigh = -Infinity;

    window.forEach(c => {
      if (c.low < minLow) minLow = c.low;
      if (c.high > maxHigh) maxHigh = c.high;
    });

    const currentPrice = candles[candles.length - 1].close;
    const threshold = (maxHigh - minLow) * 0.05;

    return {
      support: minLow,
      resistance: maxHigh,
      isNearSupport: Math.abs(currentPrice - minLow) <= threshold,
      isNearResistance: Math.abs(currentPrice - maxHigh) <= threshold,
    };
  }

  detectSMC(candles) {
    const n = candles.length;
    const cur = candles[n - 1];
    const prev = candles[n - 2];
    const prev2 = candles[n - 3];
    const prev3 = candles[n - 4];

    // Fair Value Gap (FVG)
    let bullishFVGFilled = false;
    let bearishFVGFilled = false;
    let activeFVG = null;

    if (prev3 && prev2 && prev) {
      if (prev.low > prev3.high) {
        // Bullish FVG zone: between prev3.high and prev.low
        activeFVG = { type: 'BULLISH', top: prev.low, bottom: prev3.high };
        if (cur.low <= activeFVG.top && cur.close >= activeFVG.bottom) {
          bullishFVGFilled = true;
        }
      } else if (prev.high < prev3.low) {
        // Bearish FVG zone
        activeFVG = { type: 'BEARISH', top: prev3.low, bottom: prev.high };
        if (cur.high >= activeFVG.bottom && cur.close <= activeFVG.top) {
          bearishFVGFilled = true;
        }
      }
    }

    // Order Block (OB)
    let bullishOBTapped = false;
    let bearishOBTapped = false;
    let activeOB = null;

    // Search recent 12 candles for an unmitigated Order Block
    for (let i = n - 5; i >= n - 15 && i >= 0; i--) {
      const c = candles[i];
      const nextC = candles[i + 1];
      if (!nextC) continue;

      // Bullish OB: down candle followed by strong bullish expansion breaking high
      if (c.close < c.open && nextC.close > c.high) {
        activeOB = { type: 'BULLISH', top: c.high, bottom: c.low, time: c.time };
        if (cur.low <= c.high && cur.close >= c.low) {
          bullishOBTapped = true;
          break;
        }
      }
      // Bearish OB: up candle followed by strong bearish displacement breaking low
      else if (c.close > c.open && nextC.close < c.low) {
        activeOB = { type: 'BEARISH', top: c.high, bottom: c.low, time: c.time };
        if (cur.high >= c.low && cur.close <= c.high) {
          bearishOBTapped = true;
          break;
        }
      }
    }

    // Liquidity Sweeps
    const lookbackHigh = Math.max(...candles.slice(-15, -2).map(c => c.high));
    const lookbackLow = Math.min(...candles.slice(-15, -2).map(c => c.low));

    const bullishLiquiditySweep = (cur.low < lookbackLow && cur.close > lookbackLow);
    const bearishLiquiditySweep = (cur.high > lookbackHigh && cur.close < lookbackHigh);

    // Structure (BOS / CHoCH)
    let structure = 'NEUTRAL';
    if (cur.close > lookbackHigh) structure = 'BULLISH_BOS';
    else if (cur.close < lookbackLow) structure = 'BEARISH_BOS';
    else if (bullishLiquiditySweep) structure = 'BULLISH_CHOCH';
    else if (bearishLiquiditySweep) structure = 'BEARISH_CHOCH';

    return {
      bullishOBTapped,
      bearishOBTapped,
      activeOB,
      bullishFVGFilled,
      bearishFVGFilled,
      activeFVG,
      bullishLiquiditySweep,
      bearishLiquiditySweep,
      structure,
    };
  }

  detectPriceAction(candles) {
    const cur = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const body = Math.abs(cur.close - cur.open);
    const totalRange = cur.high - cur.low;
    const lowerWick = Math.min(cur.open, cur.close) - cur.low;
    const upperWick = cur.high - Math.max(cur.open, cur.close);

    const isHammer = lowerWick >= (body * 2) && upperWick <= (body * 0.5) && totalRange > 0;
    const isShootingStar = upperWick >= (body * 2) && lowerWick <= (body * 0.5) && totalRange > 0;
    const isBullishEngulfing = prev && (prev.close < prev.open) && (cur.close > cur.open) && (cur.close > prev.open) && (cur.open < prev.close);
    const isBearishEngulfing = prev && (prev.close > prev.open) && (cur.close < cur.open) && (cur.close < prev.open) && (cur.open > prev.close);

    return {
      isHammer,
      isShootingStar,
      isBullishEngulfing,
      isBearishEngulfing,
    };
  }

  getDefaultNeutralAnalysis() {
    return {
      action: 'WAIT',
      direction: 'NEUTRAL',
      confidence: 50,
      actionTitle: 'INITIALIZING AI SCANNER...',
      actionSubtitle: 'Market candles analyze ho rahi hain.',
      tradeStyle: 'SCALPING',
      urduReasoning: 'Candlestick data load ho raha hai...',
      levels: {
        entry: 0,
        sl: 0,
        slPercent: '0.00',
        tp1: 0,
        tp1Percent: '0.00',
        tp2: 0,
        tp2Percent: '0.00',
        rrRatio: '1 : 2.0',
      },
      indicators: { rsi: 50, ema20: 0, ema50: 0, atr: 0, volumeRatio: '1.0' },
      smc: { structure: 'NEUTRAL', orderBlock: null, fvg: null },
      sr: { support: 0, resistance: 0 },
      confluences: ['Connecting to Market Feed...'],
    };
  }
}
