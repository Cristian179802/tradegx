module.exports = {
  processTrade(trade, state) {
    const projectedEquity = state.equity + trade.profit;

    const drawdown = projectedEquity - state.peakEquity;

    // 🚨 MAX DAILY LOSS RULE
    if (state.dailyPnL + trade.profit < state.maxDailyLoss) {
      return {
        allowed: false,
        reason: "Daily loss limit exceeded",
      };
    }

    // 🚨 MAX DRAWDOWN RULE
    if (drawdown < state.maxDrawdown) {
      return {
        allowed: false,
        reason: "Max drawdown exceeded",
      };
    }

    return { allowed: true };
  },
};