import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HeadwayConfig = sequelize.define(
  "HeadwayConfig",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    route_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    from_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    to_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    headway_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 60,
      },
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    tableName: "headway_configs",
    timestamps: false,
    indexes: [
      { fields: ["route_id"] },
      { unique: true, fields: ["route_id", "from_time"] },
    ],
  },
);

export default HeadwayConfig;
