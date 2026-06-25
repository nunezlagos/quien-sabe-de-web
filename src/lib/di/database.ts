import { drizzle } from 'drizzle-orm/d1';
import type { Database } from './types';
import type * as schema from '../../database/schema';

function pickBinding(objeto: unknown): Database | undefined {
	if (!objeto || typeof objeto !== 'object') return undefined;
	const obj = objeto as Record<string, unknown>;

	const directDb = (obj as { runtime?: { env?: { DB?: Database } } })?.runtime?.env?.DB
		|| (obj as { DB?: Database })?.DB
		|| (obj as { locals?: { runtime?: { env?: { DB?: Database } } } })?.locals?.runtime?.env?.DB
		|| (obj as { locals?: { DB?: Database } })?.locals?.DB;

	return directDb;
}

export function createDatabase(context: unknown): Database {
	const dbBinding = pickBinding(context);

	if (!dbBinding && typeof process !== 'undefined' && process.env.DB) {
		// @ts-ignore - process.env.DB is a string for local dev
		return drizzle(process.env.DB, { schema }) as unknown as Database;
	}

	if (!dbBinding) {
		throw new Error(
			'Database binding (DB) not found. ' +
			'Ensure you are running with wrangler or have the binding configured.'
		);
	}

	return dbBinding;
}

export type { Database };
