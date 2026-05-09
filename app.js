const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// 🧠 STATE (institutional memory)
// =========================
global.state = {
  trades: [],
  equity: 0,
  peakEquity: 0,
  dailyPnL: 0,
  maxDailyLoss: -200,
  maxDrawdown: -500,
};

// =========================
// 🔍 LOGGER
// =========================
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// =========================
// 📊 GET DASHBOARD DATA
// =========================
app.get("/api/trades", (req, res) => {
  res.json({
    trades: global.state.trades,
    equity: global.state.equity,
    drawdown: global.state.equity - global.state.peakEquity,
    dailyPnL: global.state.dailyPnL,
  });
});

// =========================
// 🧠 RISK ENGINE IMPORT
// =========================
const riskEngine = require("./engine/risk-engine");

// =========================
// ➕ NEW TRADE (INSTITUTIONAL FLOW)
// =========================
app.post("/api/trades", (req, res) => {
  const trade = {
    id: Date.now(),
    symbol: req.body.symbol || "UNKNOWN",
    lot: Number(req.body.lot) || 0,
    profit: Number(req.body.profit) || 0,
    timestamp: new Date().toISOString(),
  };

  // ⚡ RISK VALIDATION FIRST
  const riskResult = riskEngine.processTrade(trade, global.state);

  if (!riskResult.allowed) {
    return res.status(403).json({
      success: false,
      reason: riskResult.reason,
    });
  }

  // 📊 APPLY TRADE
  global.state.trades.push(trade);

  global.state.equity += trade.profit;
  global.state.dailyPnL += trade.profit;

  if (global.state.equity > global.state.peakEquity) {
    global.state.peakEquity = global.state.equity;
  }

  // ⚡ REAL-TIME BROADCAST
  if (global.ws) {
    global.ws.broadcast({
      type: "TRADE_EXECUTED",
      trade,
      equity: global.state.equity,
      drawdown: global.state.equity - global.state.peakEquity,
    });
  }

  res.json({
    success: true,
    trade,
    equity: global.state.equity,
  });
});

module.exports = app;