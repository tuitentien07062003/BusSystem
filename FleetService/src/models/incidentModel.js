import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Incident = sequelize.define(
  "Incident",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    incident_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
    },
    trip_id: { type: DataTypes.INTEGER, allowNull: true },
    route_id: { type: DataTypes.INTEGER, allowNull: true },
    vehicle_id: { type: DataTypes.INTEGER, allowNull: true },
    driver_id: { type: DataTypes.INTEGER, allowNull: true },
    type: {
      type: DataTypes.ENUM(
        "accident",
        "traffic_jam",
        "breakdown",
        "passenger_emergency",
        "other",
      ),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    status: {
      type: DataTypes.ENUM("reported", "acknowledged", "resolved", "closed"),
      defaultValue: "reported",
    },
    admin_action: {
      type: DataTypes.ENUM(
        "none",
        "reroute",
        "cancel_trip",
        "substitute_vehicle",
      ),
      defaultValue: "none",
    },
    admin_action_notes: { type: DataTypes.TEXT, allowNull: true },
    affects_otp: { type: DataTypes.BOOLEAN, defaultValue: true },
    reported_by: { type: DataTypes.INTEGER, allowNull: true },
    acknowledged_by: { type: DataTypes.INTEGER, allowNull: true },
    acknowledged_at: { type: DataTypes.DATE, allowNull: true },
    resolved_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "incidents",
    timestamps: false,
    indexes: [
      { fields: ["status"] },
      { fields: ["trip_id"] },
      { fields: ["created_at"] },
    ],
  },
);

export default Incident;
