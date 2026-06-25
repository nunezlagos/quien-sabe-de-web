import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/database/schema';

export type TestDb = BetterSQLite3Database<typeof schema>;

/**
 * Wraps a better-sqlite3 Database to match the D1Database interface,
 * so that getDb() (which uses drizzle-orm/d1) works with test databases.
 */
class D1LikeWrapper {
	private sqlite: Database.Database;
	constructor(sqlite: Database.Database) {
		this.sqlite = sqlite;
	}
	prepare(sql: string) {
		const stmt = this.sqlite.prepare(sql);
		return new D1LikeStatement(stmt);
	}
}

class D1LikeStatement {
	private stmt: Database.Statement;
	private bound: any[] = [];
	constructor(stmt: Database.Statement) {
		this.stmt = stmt;
	}
	bind(...params: any[]) {
		this.bound = params;
		return this;
	}
	all(...params: any[]) {
		const args = params.length > 0 ? params : this.bound;
		const rows = args.length > 0 ? this.stmt.all(...args) : this.stmt.all();
		return { results: rows, success: true };
	}
	run(...params: any[]) {
		const args = params.length > 0 ? params : this.bound;
		const info = args.length > 0 ? this.stmt.run(...args) : this.stmt.run();
		return {
			success: true,
			meta: {
				changes: info.changes,
				last_row_id: info.lastInsertRowid,
			},
		};
	}
	raw(...params: any[]) {
		const args = params.length > 0 ? params : this.bound;
		this.stmt.raw(true);
		const rows = args.length > 0 ? this.stmt.all(...args) : this.stmt.all();
		this.stmt.raw(false);
		return rows as any[][];
	}
}

export function createInMemoryDb(): TestDb {
	const sqlite = new Database(':memory:');
	const db = drizzle(sqlite, { schema });
	bootstrapSchema(sqlite);
	return db;
}

export function createD1LikeBinding(sqlite: Database.Database): D1LikeWrapper {
	return new D1LikeWrapper(sqlite);
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
			commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
			interests TEXT,
			onboarded_at INTEGER,
			accepted_terms_at INTEGER,
			consent_email_product INTEGER,
			consent_analytics INTEGER,
			consent_profile_public INTEGER,
			email_verified INTEGER NOT NULL DEFAULT 0,
			email_verification_token TEXT,
			session_token TEXT,
			created_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS trades (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			symbol TEXT NOT NULL,
			name TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			category TEXT NOT NULL DEFAULT 'hogar',
			description TEXT,
			base_price_clp INTEGER,
			image_url TEXT,
			whatsapp TEXT,
			verified INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'active',
			commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
			available_now INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS reviews (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
			user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			reviewer_name TEXT NOT NULL,
			rating INTEGER NOT NULL,
			body TEXT NOT NULL,
			response TEXT,
			responded_at INTEGER,
			created_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS contact_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
			visitor_id TEXT,
			user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			event_type TEXT NOT NULL,
			created_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS user_views (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
			created_at INTEGER,
			UNIQUE(user_id, trade_id)
		);

		CREATE TABLE IF NOT EXISTS favorites (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
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