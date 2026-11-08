import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ShiftSwap = sequelize.define(
  "ShiftSwap",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    original_employee_id: { type: DataTypes.INTEGER, allowNull: false },
    substitute_employee_id: { type: DataTypes.INTEGER, allowNull: false },
    duty_assignment_id: { type: DataTypes.INTEGER, allowNull: false },
    swap_date: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    requested_by: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
      defaultValue: "pending",
    },
    created_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "shift_swap_requests",
    timestamps: false,
    indexes: [{ fields: ["duty_assignment_id"] }],
  },
);

export default ShiftSwap;
