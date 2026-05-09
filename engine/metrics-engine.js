const eventBus = require("../realtime/eventBus");
const { broadcast } = require("../realtime/websocket");

let state = {
  balance: 10000,
  equity: 10000,
  peakEquity: 10000,
  trades: [],
};

function calc() {
  const wins = state.trades.filter(t => t.pnl > 0);
  const losses = state.trades.filter(t => t.pnl < 0);

  const profit = wins.reduce((a, b) => a + b.pnl, 0);
  const loss = Math.abs(losses.reduce((a, b) => a + b.pnl, 0));

  const profitFactor = loss === 0 ? profit : profit / loss;

  const winrate =
    state.trades.length === 0
      ? 0
      : (wins.length / state.trades.length) * 100;

  const drawdown =
    ((state.peakEquity - state.equity) / state.peakEquity) * 100;

  return {
    balance: state.balance,
    equity: state.equity,
    drawdown: drawdown.toFixed(2),
    winrate: winrate.toFixed(2),
    profitFactor: profitFactor.toFixed(2),
    trades: state.trades.length,
  };
}

eventBus.on("TRADE_CREATED", (trade) => {
  state.trades.push(trade);

  state.balance += trade.pnl;
  state.equity += trade.pnl;

  if (state.equity > state.peakEquity) {
    state.peakEquity = state.equity;
  }

  const metrics = calc();

  console.log("📊 METRICS:", metrics);

  broadcast({
    type: "METRICS_UPDATE",
    data: metrics,
  });
});