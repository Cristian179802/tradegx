const http = require("http");
const app = require("./app");
const { createWebSocketServer } = require("./realtime/websocket");

// engines
require("./engine/ai-engine");
require("./engine/metrics-engine");
require("./engine/ai-coach");
require("./engine/risk-engine");

const server = http.createServer(app);

// event bus (institutional backbone)
const ws = createWebSocketServer(server);
global.ws = ws;

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🏦 Institutional Trading System running on ${PORT}`);
});