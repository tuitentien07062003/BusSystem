import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DriverUnavailability = sequelize.define(
  "DriverUnavailability",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    driver_id: { type: DataTypes.INTEGER, allowNull: false },
    date_from: { type: DataTypes.DATEONLY, allowNull: false },
    date_to: { type: DataTypes.DATEONLY, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "sick",
        "personal",
        "vacation",
        "training",
        "suspended",
      ),
      allowNull: false,
    },
    reason: { type: DataTypes.TEXT, allowNull: true },
    reported_by: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "driver_unavailability",
    timestamps: false,
    indexes: [{ fields: ["driver_id", "date_from", "date_to"] }],
  },
);

export default DriverUnavailability;
