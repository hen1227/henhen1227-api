import sequelize from "./Sequelize.js";
import {DataTypes} from "sequelize";

const ClubEventModel = sequelize.define('ClubEvent', {
    datetime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notifySubscribers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    clubId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Clubs',
            key: 'id',
        },
    },
});

export default ClubEventModel;