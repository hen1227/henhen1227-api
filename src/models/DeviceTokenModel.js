// id: primary key
// userId: foreign key referencing the User model
// token: the device token string
// platform: enum (e.g., "iOS", "Android")

import sequelize from "./Sequelize.js";
import {DataTypes} from "sequelize";

const DeviceTokenModel = sequelize.define('DeviceToken', {
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
    token: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    platform: {
        type: DataTypes.ENUM('ios', 'iOS', 'Android', 'web'),
    }
});

export default DeviceTokenModel;
