import { DataTypes } from 'sequelize';
import sequelize from "./Sequelize.js";

const ShopItemModel = sequelize.define('ShopItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: DataTypes.STRING,
    uniqueId: DataTypes.STRING,
    description: DataTypes.TEXT,
    cost: DataTypes.INTEGER,
    rarity: DataTypes.ENUM('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'),
    discounted: DataTypes.BOOLEAN,
    // itemData: DataTypes.JSON,
    // ...any other columns you need
});

export default ShopItemModel;