import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ShiftTemplate = sequelize.define(
  "ShiftTemplate",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    prep_start: { type: DataTypes.TIME, allowNull: false },
    prep_end: { type: DataTypes.TIME, allowNull: false },
    drive_start: { type: DataTypes.TIME, allowNull: false },
    drive_end: { type: DataTypes.TIME, allowNull: false },
    handover_start: { type: DataTypes.TIME, allowNull: true },
    handover_end: { type: DataTypes.TIME, allowNull: true },
    buffer_minutes: { type: DataTypes.INTEGER, defaultValue: 45 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "shift_templates",
    timestamps: false,
  },
);

export default ShiftTemplate;
