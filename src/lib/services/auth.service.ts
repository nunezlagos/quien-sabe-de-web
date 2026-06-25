import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import type { Database } from '../di/database';

export class AuthService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getUserById(id: number) {
		return await this.db
			.select().from(users).where(eq(users.id, id)).get() || null;
	}

	async getUserByEmail(email: string) {
		return await this.db
			.select().from(users).where(eq(users.email, email)).get() || null;
	}

	async createUser(data: { email: string; name: string; role?: 'user' | 'provider' | 'admin'; avatarUrl?: string }) {
		return await this.db.insert(users).values({
			email: data.email,
			name: data.name,
			role: data.role || 'user',
			avatarUrl: data.avatarUrl,
		}).returning().get();
	}
}
