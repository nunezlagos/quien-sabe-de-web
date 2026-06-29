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

function wrapQueryBuilder<T extends object>(qb: T): T {
  return new Proxy(qb, {
    get(target, prop, receiver) {
      if (prop === 'all') {
        return async () => await target;
      }
      if (prop === 'get') {
        return async () => {
          const rows = await target;
          return Array.isArray(rows) ? rows[0] : rows;
        };
      }
      if (prop === 'run') {
        return async () => {
          const result = await target;
          if (result && typeof result === 'object' && 'insertId' in (result as any)) {
            const r = result as any;
            return { changes: r.affectedRows ?? 0, lastInsertRowid: r.insertId ?? 0 };
          }
          if (Array.isArray(result) && result.length === 1 && 'insertId' in result[0]) {
            const r = result[0] as any;
            return { changes: r.affectedRows ?? 0, lastInsertRowid: r.insertId ?? 0 };
          }
          return { changes: 0, lastInsertRowid: 0 };
        };
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          if (result && typeof result === 'object') {
            return wrapQueryBuilder(result);
          }
          return result;
        };
      }
      return value;
    },
  });
}

export function getDb() {
  if (!dbInstance) {
    const raw = drizzle(getPool(), { schema, mode: 'default' });
    dbInstance = wrapQueryBuilder(raw);
  }
  return dbInstance;
}

export function getDbFromContext() {
  return getDb();
}
