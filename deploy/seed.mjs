import mysql from 'mysql2/promise';

const {
  DB_HOST = 'db',
  DB_PORT = '3306',
  DB_USER = 'quiensabe',
  DB_PASSWORD = 'quiensabe',
  DB_NAME = 'quiensabe',
} = process.env;

const conn = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

console.log('Seeding database...');
// Seed data goes here if needed
console.log('Seeding complete.');
await conn.end();
