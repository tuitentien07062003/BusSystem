import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import "./models/associations.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "RouteService Backend" });
});

app.use("/tbus", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint không tồn tại." });
});

app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("[DB] Kết nối PostgreSQL thành công.");

    app.listen(PORT, () => {
      console.log(`[Server] Đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[DB] Không kết nối được database:", err.message);
    process.exit(1);
  }
}

start();
