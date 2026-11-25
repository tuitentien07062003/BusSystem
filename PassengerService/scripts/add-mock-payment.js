import "dotenv/config";
import sequelize from "../src/config/database.js";

async function up() {
  // 1. Kiểm tra type
  const rows = await sequelize.query(
    `SELECT data_type, udt_name 
     FROM information_schema.columns 
     WHERE table_name = 'tickets' AND column_name = 'status'`,
    { type: sequelize.QueryTypes.SELECT },
  );

  const info = rows[0];
  console.log("Current status column:", info);

  if (!info) {
    console.error("❌ Không tìm thấy cột status");
    process.exit(1);
  }

  if (info.data_type !== "USER-DEFINED") {
    console.log("· status là VARCHAR, không cần alter enum");
    process.exit(0);
  }

  const enumType = info.udt_name;
  console.log(`Enum type: ${enumType}`);

  // 2. Xem các giá trị hiện có
  const labels = await sequelize.query(
    `SELECT enumlabel FROM pg_enum 
     WHERE enumtypid = '${enumType}'::regtype
     ORDER BY enumsortorder`,
    { type: sequelize.QueryTypes.SELECT },
  );
  console.log("Current values:", labels.map((l) => l.enumlabel).join(", "));

  // 3. Thêm 'pending' nếu chưa có
  const hasPending = labels.some((l) => l.enumlabel === "pending");
  if (!hasPending) {
    await sequelize.query(
      `ALTER TYPE ${enumType} ADD VALUE IF NOT EXISTS 'pending'`,
    );
    console.log("✓ Added 'pending' to enum");
  } else {
    console.log("· 'pending' already exists");
  }

  console.log("\n✅ Done");
  process.exit(0);
}

up().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
