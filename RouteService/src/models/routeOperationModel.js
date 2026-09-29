import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RouteOperation = sequelize.define(
  "RouteOperation",
  {
    route_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    operating_start_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "05:00",
    },
    operating_end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "22:00",
    },
    base_fare: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7000,
      validate: {
        min: 0,
      },
    },
    min_headway_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 900,
      validate: {
        min: 60,
      },
    },
    max_headway_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1800,
      validate: {
        min: 60,
      },
    },
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "route_operations",
    timestamps: false,
    indexes: [{ unique: true, fields: ["route_id"] }],
  },
);

export default RouteOperation;
