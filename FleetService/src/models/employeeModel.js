import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Employee = sequelize.define(
  "Employee",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true },
    type: {
      type: DataTypes.ENUM("driver", "co_driver", "depot_staff", "dispatcher"),
      allowNull: false,
    },
    license_number: { type: DataTypes.STRING(50), allowNull: true },
    license_class: { type: DataTypes.STRING(10), allowNull: true },
    license_expiry: { type: DataTypes.DATEONLY, allowNull: true },
    hire_date: { type: DataTypes.DATEONLY, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "employees",
    timestamps: false,
    indexes: [{ fields: ["type"] }, { fields: ["is_active"] }],
  },
);

export default Employee;
