// src/models/agencyModel.js
// Định nghĩa model Agency — ánh xạ bảng `agencies`
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Agency = sequelize.define(
  "Agency",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    agency_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    agency_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    agency_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    agency_timezone: {
      type: DataTypes.STRING,
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "agencies",
    timestamps: false,
    indexes: [
      { fields: ["agency_id"] },
      { fields: ["agency_name"] },
      { fields: ["is_active"] },
    ],
  }
);

export default Agency;
