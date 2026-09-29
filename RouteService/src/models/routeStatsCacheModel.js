import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RouteStatsCache = sequelize.define(
  "RouteStatsCache",
  {
    route_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    go_length_m: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    return_length_m: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    go_travel_time_sec: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    return_travel_time_sec: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    computed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "route_stats_cache",
    timestamps: false,
  },
);

export default RouteStatsCache;
