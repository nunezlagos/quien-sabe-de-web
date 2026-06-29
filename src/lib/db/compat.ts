import { eq } from 'drizzle-orm';

function makeThenable(promise: any, db?: any, table?: any): any {
  const wrapped = Promise.resolve(promise);
  return Object.assign(wrapped, {
    async get() {
      const rows = await promise;
      return Array.isArray(rows) ? rows[0] : undefined;
    },
    async all() {
      const rows = await promise;
      return Array.isArray(rows) ? rows : [];
    },
    async run() {
      await promise;
    },
    returning() {
      return {
        get: async () => {
          const result = await promise;
          const insertId = result?.insertId;
          if (!insertId || !table || !db) return {};
          const [row] = await db.select().from(table).where(eq(table.id, insertId)).limit(1);
          return row;
        },
      };
    },
  });
}

function proxyBuilder(target: any, _type?: string, _table?: any, _db?: any): any {
  return new Proxy(target, {
    get(obj, prop) {
      if (prop === 'returning') {
        return () => makeThenable(Promise.resolve(obj), _db, _table).returning();
      }

      const value = Reflect.get(obj, prop);
      if (typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(obj, args);
          if (result && typeof result === 'object') {
            if (typeof result.then === 'function') {
              return makeThenable(result, _db, _table);
            }
            if (!Array.isArray(result)) {
              return proxyBuilder(result, _type, _table, _db);
            }
          }
          return result;
        };
      }
      return value;
    },
  });
}

export function d1(db: any): any {
  const wrapped: Record<string, any> = {};
  wrapped.select = (...args: any[]) => proxyBuilder(db.select(...args), 'select', undefined, db);
  wrapped.insert = (table: any) => proxyBuilder(db.insert(table), 'insert', table, db);
  wrapped.update = (...args: any[]) => proxyBuilder(db.update(...args), 'update', undefined, db);
  wrapped.delete = (...args: any[]) => proxyBuilder(db.delete(...args), 'delete', undefined, db);
  return wrapped;
}
