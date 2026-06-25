import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type * as schema from '../../database/schema';

export type Database = DrizzleD1Database<typeof schema>;

export interface AuthUser {
	id: number;
	email: string;
	name: string;
	role: 'user' | 'provider' | 'admin';
	roles: ('user' | 'provider' | 'admin')[];
	activeRole: string;
	status: 'active' | 'banned';
	onboardedAt: Date | null;
}

export interface AppContext {
	locals: {
		user?: AuthUser;
		runtime?: {
			env: {
				DB: Database;
				[key: string]: unknown;
			};
		};
		DB?: Database;
	};
	cookies?: {
		get(name: string): { value: string } | undefined;
		set(name: string, value: string, options?: Record<string, unknown>): void;
		delete(name: string): void;
	};
}

export interface Env {
	DB: Database;
	[key: string]: unknown;
}
