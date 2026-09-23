import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TripPattern = sequelize.define(
  "TripPattern",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pattern_code: { type: DataTypes.STRING, allowNull: false },
    route_id: { type: DataTypes.INTEGER, allowNull: true },
    shape_id: { type: DataTypes.STRING, allowNull: true },
    trip_headsign: { type: DataTypes.STRING, allowNull: true },
    direction_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "trip_patterns", timestamps: false }
);

export default TripPattern;
