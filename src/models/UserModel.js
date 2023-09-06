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
    username: {
        type: DataTypes.STRING,
        unique: false,
        allowNull: true
    },
    mcUUID: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isUsernameVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isOp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    subscribedClubs: {
        type: DataTypes.VIRTUAL,  // This will not exist in the DB but will represent the relationship.
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