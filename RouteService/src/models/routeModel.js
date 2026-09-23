import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Route = sequelize.define(
  "Route",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    route_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    agency_id: { type: DataTypes.INTEGER, allowNull: true },
    route_short_name: { type: DataTypes.STRING, allowNull: false },
    route_full_name: { type: DataTypes.STRING, allowNull: false },
    route_color: { type: DataTypes.STRING, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "routes", timestamps: false }
);

export default Route;
