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

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getRawDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!dbInstance) dbInstance = drizzle(getPool(), { schema, mode: 'default' });
  return dbInstance;
}

const D1_METHODS = new Set(['all', 'get', 'run']);

function d1wrap<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === 'symbol') {
        return Reflect.get(obj, prop, receiver);
      }
      if (D1_METHODS.has(prop as string)) {
        if (prop === 'all') {
          return async () => await obj;
        }
        if (prop === 'get') {
          return async () => {
            const rows = await obj;
            return Array.isArray(rows) ? rows[0] : rows;
          };
        }
        return async () => {
          const result = await obj;
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
      const value = Reflect.get(obj, prop, receiver);
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = (value as (...a: unknown[]) => unknown).apply(obj, args);
          if (result && typeof result === 'object') {
            return d1wrap(result as object);
          }
          return result;
        };
      }
      return value;
    },
  });
}

export function getDb() {
  const raw = getRawDb();
  return {
    select: (...args: unknown[]) => d1wrap((raw as any).select(...args)),
    insert: (table: any) => d1wrap((raw as any).insert(table)),
    update: (table: any) => d1wrap((raw as any).update(table)),
    delete: (table: any) => d1wrap((raw as any).delete(table)),
  };
}

export function getDbFromContext() {
  return getDb();
}