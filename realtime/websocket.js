let wss;

function createWebSocketServer(server) {
  const WebSocket = require("ws");

  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket connected");
  });
}

// 📡 broadcast global (trimite la frontend)
function broadcast(message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = {
  createWebSocketServer,
  broadcast,
};