import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Stop = sequelize.define(
  "Stop",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    stop_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    stop_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    geom: {
      type: DataTypes.GEOMETRY("POINT", 4326),
      allowNull: false,
    },
    stop_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "stops",
    timestamps: false,
    indexes: [
      { fields: ["stop_id"] },
      { fields: ["stop_name"] },
      { fields: ["is_active"] },
    ],
  },
);

export default Stop;
