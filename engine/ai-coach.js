const eventBus = require("../realtime/eventBus");
const { broadcast } = require("../realtime/websocket");

// 🧠 memorie comportament trader
let history = [];

function analyzeBehavior(trade) {
  history.push(trade);

  // păstrăm ultimele 30
  if (history.length > 30) history.shift();

  let signals = [];
  let messages = [];

  // 🔴 OVERTRADING
  const recent5 = history.slice(-5);
  if (recent5.length === 5) {
    const sameSymbol = recent5.filter(t => t.symbol === trade.symbol).length;
    if (sameSymbol >= 4) {
      signals.push("OVERTRADING");
      messages.push("You are overtrading the same instrument.");
    }
  }

  // 🔴 REVENGE TRADING
  const last = history[history.length - 2];
  if (last && last.pnl < 0 && trade.lot_size > last.lot_size) {
    signals.push("REVENGE_TRADING");
    messages.push("You increased lot size after a loss. Possible revenge trading.");
  }

  // 🔴 LOSS STREAK
  const last10 = history.slice(-10);
  const losses = last10.filter(t => t.pnl < 0).length;
  if (losses >= 7) {
    signals.push("LOSS_STREAK");
    messages.push("You are in a heavy losing streak. Stop trading.");
  }

  // 🔴 RISKY TRADE
  if (trade.lot_size > 1) {
    signals.push("HIGH_RISK");
    messages.push("Your position size is too high.");
  }

  // 🧠 GENERATE FINAL FEEDBACK
  let summary;

  if (signals.length === 0) {
    summary = "Good discipline. Keep following your plan.";
  } else if (signals.length === 1) {
    summary = messages[0];
  } else {
    summary = "Multiple risk signals detected: " + messages.join(" | ");
  }

  return {
    trade,
    signals,
    messages,
    summary,
    score: signals.length === 0 ? 90 : 50 - signals.length * 10
  };
}

// 🔥 ascultă trade-uri
eventBus.on("TRADE_CREATED", (trade) => {
  const result = analyzeBehavior(trade);

  console.log("🧠 AI COACH:", result);

  broadcast({
    type: "AI_COACH",
    data: result
  });
});