import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";

const FundingCostModel = sequelize.define('FundingCosts', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true,
    },
    hourlyCosts: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            return JSON.parse(this.getDataValue('hourlyCosts'));
        },
        set(val) {
            this.setDataValue('hourlyCosts', JSON.stringify(val));
        }
    },
    totalCost: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

export default FundingCostModel;