const express = require("express");
const router = express.Router();

const eventBus = require("../../realtime/eventBus");
const { broadcast } = require("../../realtime/websocket");

// 📥 RECEIVE TRADE
router.post("/trade", (req, res) => {
  const trade = req.body;

  if (!trade) {
    return res.status(400).json({ error: "No trade data" });
  }

  const normalizedTrade = {
    id: Date.now(),
    symbol: trade.symbol,
    lot_size: trade.lot_size ?? 0,
    pnl: trade.pnl ?? 0,
    type: trade.type || "MARKET",
    time: new Date().toISOString()
  };

  // 💾 salvare globală
  global.trades.push(normalizedTrade);

  console.log("📥 MT5 TRADE RECEIVED:", normalizedTrade);

  // 🧠 trigger AI
  eventBus.emit("TRADE_CREATED", normalizedTrade);

  // 📡 live update frontend
  broadcast({
    type: "NEW_TRADE",
    data: normalizedTrade
  });

  res.json({
    success: true,
    trade: normalizedTrade
  });
});

module.exports = router;