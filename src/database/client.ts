import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const getDb = (context: any) => {
  let dbBinding = context?.locals?.runtime?.env?.DB || context?.locals?.DB;

  if (!dbBinding && typeof process !== 'undefined' && process.env.DB) {
      // @ts-ignore
      dbBinding = process.env.DB;
  }

  if (!dbBinding) {
    throw new Error('Database binding (DB) not found. Ensure you are running with wrangler or have the binding configured.');
  }

  return drizzle(dbBinding, { schema });
};
