import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VehicleType = sequelize.define(
  "VehicleType",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    capacity_seated: { type: DataTypes.INTEGER, allowNull: false },
    capacity_standing: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_accessible: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "vehicle_types",
    timestamps: false,
  },
);

export default VehicleType;
