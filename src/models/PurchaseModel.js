import { DataTypes } from "sequelize";
import sequelize from "./Sequelize.js";

const PurchaseModel = sequelize.define('Purchase', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mcId: DataTypes.INTEGER,
    itemId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    location: DataTypes.JSON,
    timestamp: DataTypes.DATE,
});

export default PurchaseModel;
