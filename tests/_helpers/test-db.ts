import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../../src/database/schema';

const TRUNCATE_ORDER = [
  'ticket_messages',
  'tickets',
  'expenses',
  'monthly_reports',
  'verification_documents',
  'provider_availability',
  'events_log',
  'user_roles',
  'donations',
  'user_views',
  'reviews',
  'favorites',
  'contact_events',
  'portfolio_images',
  'trade_communes',
  'trades',
  'users',
  'admin_audit_log',
  'app_settings',
  'communes',
];

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

let pool: mysql.Pool | null = null;
let dbInstance: TestDb | null = null;

export function getTestPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'quien_sabe',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quien_sabe',
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: false,
    });
  }
  return pool;
}

export function getTestDb(): TestDb {
  if (!dbInstance) {
    dbInstance = drizzle(getTestPool(), { schema, mode: 'default' });
  }
  return dbInstance;
}

export async function resetTestDb(): Promise<void> {
  const conn = await getTestPool().getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of TRUNCATE_ORDER) {
      await conn.query(`TRUNCATE TABLE \`${t}\``);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    conn.release();
  }
}

export async function closeTestDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}
