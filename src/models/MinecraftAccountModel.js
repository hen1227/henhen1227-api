import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";

const MinecraftAccountModel = sequelize.define('MinecraftAccount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id',
        },
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    username: {
        type: DataTypes.STRING,
        unique: false,
        allowNull: true
    },
    isOp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Game wins model reference
    // GameWins: {
    //     type: DataTypes.INTEGER,
    //     references: {
    //         model: 'GameWins',
    //         key: 'id'
    //     },
    //     allowNull: true
    // },
    uuid: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
});

export default MinecraftAccountModel
