import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";

const MinecraftEventModel = sequelize.define('MinecraftEvent', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    short_description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    long_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    times_voted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    times_available: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

export default MinecraftEventModel;
