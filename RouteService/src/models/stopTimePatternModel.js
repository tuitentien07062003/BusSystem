import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const StopTimePattern = sequelize.define(
  "StopTimePattern",
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    trip_pattern_id: { type: DataTypes.INTEGER, allowNull: true },
    stop_id: { type: DataTypes.INTEGER, allowNull: true },
    stop_sequence: { type: DataTypes.INTEGER, allowNull: false },
    arrival_offset_seconds: { type: DataTypes.INTEGER, allowNull: false },
    departure_offset_seconds: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "stop_time_patterns", timestamps: false }
);

export default StopTimePattern;
