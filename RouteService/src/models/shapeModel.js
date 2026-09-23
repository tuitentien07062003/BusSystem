import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Shape = sequelize.define(
  "Shape",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shape_id: { type: DataTypes.STRING, allowNull: false },
    geom: { type: DataTypes.GEOMETRY("POINT", 4326), allowNull: false },
    shape_pt_sequence: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "shapes", timestamps: false, indexes: [{ fields: ["shape_id"] }] }
);

export default Shape;
