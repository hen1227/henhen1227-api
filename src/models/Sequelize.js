import { Sequelize } from 'sequelize';

// const sequelize = new Sequelize({
//     storage: './database/SQLiteDatabase.sqlite',
//     dialect: 'sqlite',
// });

const sequelize = new Sequelize({
    database: 'postgres',
    username: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: 'localhost',
    port: 5432, // default port for PostgreSQL, change if yours is different
    dialect: 'postgres',
});

try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

export default sequelize;
