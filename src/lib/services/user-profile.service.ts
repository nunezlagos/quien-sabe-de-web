import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import type { Database } from '../di/database';
import { updateReturning } from '../db/returning';

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
		return await updateReturning(this.db, users, data, eq(users.id, userId));
	}
}
