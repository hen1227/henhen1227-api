import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";

const UserModel = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    subscribedClubs: {
        type: DataTypes.VIRTUAL,
    },
    leadingClubs: {
        type: DataTypes.VIRTUAL,
    },
    calendarPreferences: {
        type: DataTypes.JSON,
        allowNull: true
    }
});

export default UserModel;
