import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    storage: './database/SQLiteDatabase.sqlite',
    dialect: 'sqlite',
});

export default sequelize;
