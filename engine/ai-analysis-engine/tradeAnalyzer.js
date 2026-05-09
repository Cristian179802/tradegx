const eventBus = require("../../realtime/eventBus");
const { broadcast } = require("../../realtime/websocket");

let recentTrades = [];

// 🧠 AI ENGINE V2 - cu memorie
function analyzeTrade(trade) {

  let signals = [];

  // 📦 memorie
  recentTrades.push(trade);

  if (recentTrades.length > 20) {
    recentTrades.shift();
  }

  // 📉 risc mare
  if (trade.lot_size > 1) {
    signals.push("RISKY_TRADE");
  }

  // 💥 volatilitate
  if (Math.abs(trade.pnl) > 50) {
    signals.push("HIGH_VOLATILITY_TRADE");
  }

  // 🧠 revenge trading
  const lastTrade = recentTrades[recentTrades.length - 2];

  if (lastTrade && lastTrade.pnl < 0 && trade.lot_size > lastTrade.lot_size) {
    signals.push("REVENGE_TRADING");
  }

  // 📊 overtrading
  if (recentTrades.length >= 5) {
    const last5 = recentTrades.slice(-5);

    const sameSymbol = last5.filter(t => t.symbol === trade.symbol).length;

    if (sameSymbol >= 4) {
      signals.push("OVERTRADING_SAME_SYMBOL");
    }
  }

  // 📉 instabilitate
  const losses = recentTrades
    .slice(-10)
    .filter(t => t.pnl < 0).length;

  if (losses >= 7) {
    signals.push("UNSTABLE_BEHAVIOR");
  }

  return {
    trade,
    signals,
    rating:
      signals.length === 0 ? "GOOD" :
      signals.length === 1 ? "OK" :
      "BAD"
  };
}

// 🔥 IMPORTANT: evităm dublu subscribe (SAFE GUARD)
let initialized = false;

if (!initialized) {
  eventBus.on("TRADE_CREATED", (trade) => {

    const result = analyzeTrade(trade);

    console.log("🧠 AI RESULT:", result);

    // ⚡ trimitem către frontend
    if (broadcast) {
      broadcast({
        type: "AI_RESULT",
        data: result
      });
    }
  });

  initialized = true;
}

module.exports = { analyzeTrade };