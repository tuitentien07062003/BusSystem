import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Trip = sequelize.define(
  "Trip",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    trip_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    trip_pattern_id: { type: DataTypes.INTEGER, allowNull: true },
    service_id: { type: DataTypes.INTEGER, allowNull: true },
    start_time: { type: DataTypes.TIME, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "trips", timestamps: false }
);

export default Trip;
