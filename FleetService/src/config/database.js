import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "fleet_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "123456",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    define: { timestamps: false, freezeTableName: true },
    pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
    dialectOptions: { statement_timeout: 8000 },
  },
);

export default sequelize;
