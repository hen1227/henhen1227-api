import { Sequelize } from 'sequelize';

const database = process.env.POSTGRES_DATABASE;
const username = process.env.POSTGRES_USERNAME;
const password = process.env.POSTGRES_PASSWORD;

const sequelize = new Sequelize({
    database: database,
    username: username,
    password: password,
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
