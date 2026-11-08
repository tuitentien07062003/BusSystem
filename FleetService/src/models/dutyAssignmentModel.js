import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DutyAssignment = sequelize.define(
  "DutyAssignment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    shift_template_id: { type: DataTypes.INTEGER, allowNull: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: true },
    co_driver_id: { type: DataTypes.INTEGER, allowNull: true },
    vehicle_id: { type: DataTypes.INTEGER, allowNull: true },
    route_id: { type: DataTypes.INTEGER, allowNull: false },
    depot_id: { type: DataTypes.INTEGER, allowNull: true },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    buffer_minutes: { type: DataTypes.INTEGER, defaultValue: 45 },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "swapped",
      ),
      defaultValue: "scheduled",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "duty_assignments",
    timestamps: false,
    indexes: [
      { fields: ["date"] },
      { fields: ["employee_id", "date"] },
      { fields: ["vehicle_id", "date"] },
    ],
  },
);

export default DutyAssignment;
