const eventBus = require("../realtime/eventBus");
const { broadcast } = require("../realtime/websocket");

eventBus.on("TRADE_CREATED", (trade) => {
  let signals = [];

  // 🧠 logic simplu AI
  if (trade.lot_size > 1) signals.push("RISKY_TRADE");
  if (trade.pnl < -20) signals.push("HIGH_LOSS");

  const result = {
    trade,
    signals,
    rating: signals.length === 0 ? "GOOD" : "BAD",
  };

  console.log("🧠 AI RESULT:", result);

  // 📡 trimite la frontend
  broadcast({
    type: "AI_RESULT",
    data: result,
  });

  // 🚨 alerts
  if (signals.length > 0) {
    broadcast({
      type: "ALERT",
      data: {
        type: "RISK_ALERT",
        message: signals.join(", "),
        trade,
      },
    });
  }
});