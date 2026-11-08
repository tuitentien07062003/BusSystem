import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import "./models/associations.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      console.log(
        `[${req.method}] ${req.originalUrl} → ${res.statusCode} (${ms}ms)`,
      );
    });
    next();
  });
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "FleetService",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/fleet", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint không tồn tại." });
});

app.use((err, req, res, next) => {
  console.error("[FleetService Error]", err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
  });
});

let server;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("[DB] Kết nối PostgreSQL thành công (fleet_db).");

    const models = Object.keys(sequelize.models);
    console.log(
      `[Models] Đã load ${models.length} model: ${models.join(", ")}`,
    );

    server = app.listen(PORT, () => {
      console.log(`[FleetService] Đang chạy tại http://localhost:${PORT}`);
      console.log(
        `[FleetService] Health check: http://localhost:${PORT}/fleet/health`,
      );
    });
  } catch (err) {
    console.error("[DB] Không kết nối được database:", err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n[${signal}] Đang tắt FleetService...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("[Server] Đã đóng HTTP server.");
    }
    await sequelize.close();
    console.log("[DB] Đã đóng kết nối database.");
    process.exit(0);
  } catch (err) {
    console.error("[Shutdown] Lỗi:", err.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
start();
