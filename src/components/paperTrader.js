/**
 * Paper Trading Simulator for AlphaVision Pro
 * Allows users to practice trading with $10,000 virtual balance,
 * tracks live P&L, leverages, and triggers automatic "Ab Trade Close Kr Do" alerts.
 */

export class PaperTrader {
  constructor() {
    this.balance = 10000.00;
    this.positions = [];
    this.wins = 0;
    this.losses = 0;
    this.totalPnl = 0;
    this.onUpdateCallback = null;
    this.onCloseAlertCallback = null;
  }

  setCallbacks({ onUpdate, onCloseAlert }) {
    this.onUpdateCallback = onUpdate;
    this.onCloseAlertCallback = onCloseAlert;
  }

  /**
   * Open a new position
   */
  openPosition({ symbol, direction, entryPrice, amount, leverage = 10, sl, tp1, tp2 }) {
    const cost = amount;
    if (cost > this.balance) {
      alert(`Balance kam hai! Available: $${this.balance.toFixed(2)}`);
      return false;
    }

    this.balance -= cost;
    const notionalSize = cost * leverage;
    const units = notionalSize / entryPrice;

    const position = {
      id: 'pos_' + Date.now(),
      symbol,
      direction, // 'BUY' or 'SELL'
      entryPrice,
      currentPrice: entryPrice,
      amount,
      leverage,
      units,
      sl: sl || 0,
      tp1: tp1 || 0,
      tp2: tp2 || 0,
      pnl: 0,
      pnlPercent: 0,
      openTime: new Date().toLocaleTimeString(),
    };

    this.positions.push(position);
    this.notifyUpdate();
    return position;
  }

  /**
   * Update all open positions with current live price
   */
  updateMarketPrice(symbol, currentPrice) {
    let changed = false;

    this.positions.forEach(pos => {
      if (pos.symbol === symbol) {
        pos.currentPrice = currentPrice;
        let priceDiff;

        if (pos.direction === 'BUY') {
          priceDiff = currentPrice - pos.entryPrice;
        } else {
          priceDiff = pos.entryPrice - currentPrice;
        }

        const rawReturn = priceDiff / pos.entryPrice;
        pos.pnlPercent = Number((rawReturn * pos.leverage * 100).toFixed(2));
        pos.pnl = Number((pos.amount * (pos.pnlPercent / 100)).toFixed(2));
        changed = true;

        // Check if TP1 is achieved and trigger "Close Trade" recommendation
        if (pos.tp1 > 0) {
          const tp1Hit = pos.direction === 'BUY' ? (currentPrice >= pos.tp1) : (currentPrice <= pos.tp1);
          if (tp1Hit && !pos.tpNotified) {
            pos.tpNotified = true;
            if (this.onCloseAlertCallback) {
              this.onCloseAlertCallback(pos);
            }
          }
        }
      }
    });

    if (changed) {
      this.notifyUpdate();
    }
  }

  /**
   * Close a position and settle profit/loss
   */
  closePosition(id) {
    const index = this.positions.findIndex(p => p.id === id);
    if (index === -1) return;

    const pos = this.positions[index];
    const returnAmount = Math.max(0, pos.amount + pos.pnl);
    this.balance += returnAmount;
    this.totalPnl += pos.pnl;
    if (pos.pnl >= 0) this.wins++; else this.losses++;

    this.positions.splice(index, 1);
    this.notifyUpdate();
    return pos;
  }

  closeAllPositions() {
    [...this.positions].forEach(pos => this.closePosition(pos.id));
  }

  getState() {
    return {
      balance:   this.balance,
      positions: this.positions,
      totalPnl:  this.totalPnl,
      wins:      this.wins,
      losses:    this.losses,
    };
  }

  getActivePositionForSymbol(symbol) {
    return this.positions.find(p => p.symbol === symbol) || null;
  }

  notifyUpdate() {
    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        balance:   this.balance,
        positions: this.positions,
        totalPnl:  this.totalPnl,
        wins:      this.wins,
        losses:    this.losses,
      });
    }
  }
}
