import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import type { Database } from '../di/database';

export class UserProfileService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getByUserId(userId: number) {
		return await this.db
			.select().from(users).where(eq(users.id, userId)).get() || null;
	}

	async updateProfile(userId: number, data: {
		name?: string;
		avatarUrl?: string;
		communeId?: number;
		interests?: string;
	}) {
		return await this.db.update(users)
			.set(data)
			.where(eq(users.id, userId))
			.returning()
			.get();
	}
}
