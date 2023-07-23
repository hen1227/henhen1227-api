import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

sqlite3.verbose();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../database/auth/Users.db');

export let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the MCDB database.');
});

db.run('CREATE TABLE IF NOT EXISTS users(username TEXT UNIQUE, password TEXT, isVerified INTEGER, isOp INTEGER, points INTEGER)');

export default db;
