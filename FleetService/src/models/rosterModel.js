import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Roster = sequelize.define(
  "Roster",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    employee_id: { type: DataTypes.INTEGER, allowNull: true },
    shift_template_id: { type: DataTypes.INTEGER, allowNull: true },
    depot_id: { type: DataTypes.INTEGER, allowNull: true },
    is_backup: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "working",
        "completed",
        "swapped",
        "absent",
        "off",
      ),
      defaultValue: "scheduled",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "rosters",
    timestamps: false,
    indexes: [
      { fields: ["date"] },
      { unique: true, fields: ["employee_id", "date"] },
    ],
  },
);

export default Roster;
