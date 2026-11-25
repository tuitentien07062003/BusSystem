import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import "./models/index.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "PassengerService" });
});

app.use("/passenger", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint không tồn tại." });
});

app.use((err, req, res, next) => {
  console.error("[PassengerService Error]", err);
  res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
});

const PORT = process.env.PORT || 3002;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("[DB] Kết nối passenger_db thành công.");
    const models = Object.keys(sequelize.models);
    console.log(`[Models] ${models.length} models: ${models.join(", ")}`);
    app.listen(PORT, () => {
      console.log(`[PassengerService] http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[DB] Lỗi:", err.message);
    process.exit(1);
  }
}

start();
