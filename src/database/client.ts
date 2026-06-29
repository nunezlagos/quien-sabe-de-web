import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'quien_sabe',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quien_sabe',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema, mode: 'default' });
  }
  return dbInstance;
}

export function getDbFromContext() {
  return getDb();
}
