import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import type { Database } from '../di/database';
import { getDb } from '../../database/client';

export class UsersService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getAllUsers() {
		return await this.db.select().from(users).all();
	}

	async getUserById(id: number) {
		const result = await this.db.select().from(users).where(eq(users.id, id)).get();
		return result || null;
	}

	async getUserByEmail(email: string) {
		const result = await this.db.select().from(users).where(eq(users.email, email)).get();
		return result || null;
	}

	async createUser(data: { email: string; name: string; role?: 'user' | 'provider' | 'admin'; avatarUrl?: string }) {
		return await this.db.insert(users).values({
			email: data.email,
			name: data.name,
			role: data.role || 'user',
			avatarUrl: data.avatarUrl,
		}).returning().get();
	}

	async updateUser(id: number, data: Partial<{ email: string; name: string; role: 'user' | 'provider' | 'admin'; avatarUrl: string }>) {
		return await this.db.update(users)
			.set(data)
			.where(eq(users.id, id))
			.returning()
			.get();
	}

	async deleteUser(id: number) {
		return await this.db.delete(users)
			.where(eq(users.id, id))
			.returning()
			.get();
	}
}

export const getUsersService = (context: unknown) => {
	return new UsersService(getDb());
};
