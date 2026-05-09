const { broadcast } = require("../../realtime/websocket");

function sendAlert(type, message, trade = null) {

  const alert = {
    type,
    message,
    trade,
    time: new Date().toISOString()
  };

  console.log("🚨 ALERT:", alert);

  // ⚡ trimite către frontend (dacă websocket e activ)
  if (broadcast) {
    broadcast({
      type: "ALERT",
      data: alert
    });
  }

  return alert;
}

module.exports = {
  sendAlert
};