const pool = require("./db");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.get("/", (req, res) => {
  res.send("Backend rulează corect 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Date din backend ✔" });
});

app.post("/api/trade", async (req, res) => {
  const { symbol, lot, profit } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO trades (symbol, lot, profit) VALUES ($1, $2, $3) RETURNING *",
      [symbol, lot, profit]
    );

    res.json({
      message: "Trade salvat în PostgreSQL ✔",
      data: result.rows[0]
    });

  } catch (err) {
  console.error("EROARE COMPLETĂ:", err);
  res.status(500).json({ error: err.message });
}
});
app.get("/api/trades", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trades ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la DB" });
  }
});

// START SERVER
app.listen(5000, () => {
  console.log("Server pornit pe portul 5000");
});
