import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

function pickBinding(objeto: any): any {
  if (!objeto) return undefined;
  return (
    objeto?.runtime?.env?.DB ||
    objeto?.DB ||
    objeto?.locals?.runtime?.env?.DB ||
    objeto?.locals?.DB
  );
}

export function getDb(objeto: any) {
  const dbBinding = pickBinding(objeto);

  if (!dbBinding && typeof process !== 'undefined' && process.env.DB) {
    // @ts-ignore
    return drizzle(process.env.DB, { schema });
  }

  if (!dbBinding) {
    throw new Error('Database binding (DB) not found. Ensure you are running with wrangler or have the binding configured.');
  }

  return drizzle(dbBinding, { schema });
}

export const getDbFromContext = (context: any) => getDb(context?.locals ?? context);
