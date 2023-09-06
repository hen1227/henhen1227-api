import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";

const FundingPaymentModel = sequelize.define('FundingPayments', {
    paymentId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow users to be anonymous
    },
    transactionDetails: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

export default FundingPaymentModel;