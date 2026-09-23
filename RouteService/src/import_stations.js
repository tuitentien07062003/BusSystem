import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Client } = pg;

// Khởi tạo __dirname trong môi trường ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cấu hình thông tin kết nối TBus_Server và database route_db
const dbConfig = {
  user: "postgres", // Username kết nối PostgreSQL
  password: "123456", // Thay bằng mật khẩu thực tế
  host: "localhost", // Địa chỉ IP của TBus_Server (hoặc 'localhost' nếu chạy cùng máy)
  port: 5432, // Cổng PostgreSQL (mặc định 5432)
  database: "route_db", // Tên cơ sở dữ liệu
};

async function importStops() {
  const client = new Client(dbConfig);

  try {
    // 2. Đọc và parse dữ liệu GeoJSON
    const filePath = path.join(__dirname, "stations.geojson");
    const rawData = fs.readFileSync(filePath, "utf8");
    const geojson = JSON.parse(rawData);

    // 3. Kết nối tới database
    console.log("🔄 Đang kết nối tới TBus_Server...");
    await client.connect();
    console.log("✅ Kết nối thành công tới route_db!");

    // 4. Bắt đầu Transaction
    await client.query("BEGIN");

    let insertedCount = 0;
    for (const feature of geojson.features) {
      const properties = feature.properties || {};
      const coordinates = feature.geometry?.coordinates || [0, 0];

      // Xử lý dữ liệu
      const rawId = properties["@id"] || "";
      const stopId = rawId.replace("node/", "");
      const stopName = properties.name || "Chưa có tên";
      const [lon, lat] = coordinates;

      // Câu lệnh INSERT parameterized an toàn, chống SQL Injection
      const insertQuery = `
                INSERT INTO stops (stop_id, stop_name, geom, stop_type, is_active, created_at)
                VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), 1, true, CURRENT_TIMESTAMP)
                ON CONFLICT (stop_id) DO NOTHING;
            `;

      await client.query(insertQuery, [stopId, stopName, lon, lat]);
      insertedCount++;
    }

    // Commit các thay đổi nếu không có lỗi
    await client.query("COMMIT");
    console.log(`🎉 Đã nhập thành công ${insertedCount} trạm vào bảng stops.`);
  } catch (error) {
    // Hoàn tác nếu xảy ra bất kỳ lỗi nào
    await client.query("ROLLBACK");
    console.error("❌ Lỗi xử lý, đã rollback dữ liệu:", error.message);
  } finally {
    // Đóng kết nối DB
    await client.end();
    console.log("🔌 Đã ngắt kết nối DB.");
  }
}

// Chạy hàm import
importStops();
