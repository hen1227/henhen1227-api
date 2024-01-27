import { DataTypes } from "sequelize";
import sequelize from "./Sequelize.js";

const PurchaseModel = sequelize.define('Purchase', {
        mcId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'MinecraftAccounts',
                key: 'id'
            },
            allowNull: false
        },
        purchase: {
            type: DataTypes.STRING,
            allowNull: false
        },
        count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });

export default PurchaseModel;
