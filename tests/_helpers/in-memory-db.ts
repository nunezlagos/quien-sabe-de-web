import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/database/schema';

export type TestDb = BetterSQLite3Database<typeof schema>;

export function createInMemoryDb(): TestDb {
	const sqlite = new Database(':memory:');
	const db = drizzle(sqlite, { schema });
	bootstrapSchema(sqlite);
	return db;
}

function bootstrapSchema(sqlite: Database.Database) {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS communes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			region TEXT NOT NULL DEFAULT 'Metropolitana',
			created_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			password_hash TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'user',
			status TEXT NOT NULL DEFAULT 'active',
			avatar_url TEXT,
			created_at INTEGER
		);
	`);
}

export interface KVLike {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
	delete(key: string): Promise<void>;
}

export function createInMemoryKV(): KVLike {
	const store = new Map<string, { value: string; expiresAt: number | null }>();
	const ahora = () => Math.floor(Date.now() / 1000);

	return {
		async get(key) {
			const entry = store.get(key);
			if (!entry) return null;
			if (entry.expiresAt !== null && entry.expiresAt <= ahora()) {
				store.delete(key);
				return null;
			}
			return entry.value;
		},
		async put(key, value, options) {
			const ttl = options?.expirationTtl;
			store.set(key, { value, expiresAt: ttl ? ahora() + ttl : null });
		},
		async delete(key) {
			store.delete(key);
		},
	};
}

export interface FakeCookie {
	value: string;
}

export class FakeCookies {
	private store = new Map<string, FakeCookie>();

	get(name: string): FakeCookie | undefined {
		return this.store.get(name);
	}

	set(name: string, value: string, _options?: Record<string, unknown>): void {
		this.store.set(name, { value });
	}

	delete(name: string): void {
		this.store.set(name, { value: '' });
	}
}