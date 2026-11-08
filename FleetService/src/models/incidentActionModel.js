import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const IncidentAction = sequelize.define(
  "IncidentAction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    incident_id: { type: DataTypes.INTEGER, allowNull: true },
    action_type: {
      type: DataTypes.ENUM("call", "reroute", "substitute", "cancel", "note"),
      allowNull: false,
    },
    performed_by: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "incident_actions",
    timestamps: false,
    indexes: [{ fields: ["incident_id"] }],
  },
);

export default IncidentAction;
