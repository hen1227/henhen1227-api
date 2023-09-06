import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";


const FundingTotalModel = sequelize.define('FundingTotals', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true,
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

export default FundingTotalModel;