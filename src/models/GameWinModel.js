import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";
import { User } from './Models.js';

const GameWinModel = sequelize.define('GameWins', {
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'User',
            key: 'id'
        },
        allowNull: false
    },
    gameType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

export default GameWinModel;
