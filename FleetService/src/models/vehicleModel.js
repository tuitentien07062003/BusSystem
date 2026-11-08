import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Vehicle = sequelize.define(
  "Vehicle",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicle_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    license_plate: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    vehicle_type_id: { type: DataTypes.INTEGER, allowNull: true },
    capacity_seated: { type: DataTypes.INTEGER, allowNull: true },
    capacity_standing: { type: DataTypes.INTEGER, allowNull: true },
    battery_capacity_kwh: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    range_km: { type: DataTypes.INTEGER, allowNull: true },
    depot_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "vehicles",
    timestamps: false,
    indexes: [{ fields: ["depot_id"] }, { fields: ["is_active"] }],
  },
);

export default Vehicle;
