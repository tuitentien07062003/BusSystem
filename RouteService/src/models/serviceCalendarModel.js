import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ServiceCalendar = sequelize.define(
  "ServiceCalendar",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    service_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    monday: { type: DataTypes.BOOLEAN, defaultValue: false },
    tuesday: { type: DataTypes.BOOLEAN, defaultValue: false },
    wednesday: { type: DataTypes.BOOLEAN, defaultValue: false },
    thursday: { type: DataTypes.BOOLEAN, defaultValue: false },
    friday: { type: DataTypes.BOOLEAN, defaultValue: false },
    saturday: { type: DataTypes.BOOLEAN, defaultValue: false },
    sunday: { type: DataTypes.BOOLEAN, defaultValue: false },
    headway_multiplier: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 1.0,
      validate: {
        min: 0.1,
        max: 5.0,
      },
    },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { tableName: "service_calendars", timestamps: false },
);

export default ServiceCalendar;
