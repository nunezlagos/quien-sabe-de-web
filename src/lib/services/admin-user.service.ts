import { users } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../di/database';

export class AdminUserService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async list() {
		return await this.db
			.select()
			.from(users)
			.orderBy(desc(users.createdAt))
			.all();
	}

	async getById(id: number) {
		return await this.db
			.select()
			.from(users)
			.where(eq(users.id, id))
			.get() || null;
	}

	async updateRole(id: number, role: 'user' | 'provider' | 'admin'): Promise<void> {
		await this.db.update(users)
			.set({ role })
			.where(eq(users.id, id))
			.run();
	}

	async delete(id: number): Promise<void> {
		await this.db.delete(users).where(eq(users.id, id)).run();
	}
}
