import { userRoles, users } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import type { Database } from '../di/database';

export type Role = 'user' | 'provider' | 'admin';

export class RolesService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getRolesByUserId(userId: number): Promise<Role[]> {
		const rows = await this.db
			.select({ role: userRoles.role })
			.from(userRoles)
			.where(eq(userRoles.userId, userId))
			.all();
		return rows.map(r => r.role as Role);
	}

	async getPrimaryRole(userId: number): Promise<Role | null> {
		const user = await this.db
			.select({ role: users.role })
			.from(users)
			.where(eq(users.id, userId))
			.get();
		return user?.role as Role | null;
	}

	async getAllRolesForUser(userId: number): Promise<Role[]> {
		const primary = await this.getPrimaryRole(userId);
		const extra = await this.getRolesByUserId(userId);
		const all = new Set<Role>([...(primary ? [primary] : []), ...extra]);
		return Array.from(all);
	}

	async setRole(userId: number, role: Role, grantedBy?: number): Promise<void> {
		await this.db.insert(userRoles).values({
			userId,
			role,
			grantedBy,
		}).onConflictDoNothing().run();
	}

	async removeRole(userId: number, role: Role): Promise<void> {
		await this.db.delete(userRoles)
			.where(and(
				eq(userRoles.userId, userId),
				eq(userRoles.role, role)
			))
			.run();
	}

	async hasRole(userId: number, role: Role): Promise<boolean> {
		const roles = await this.getAllRolesForUser(userId);
		return roles.includes(role);
	}

	async isAdmin(userId: number): Promise<boolean> {
		return this.hasRole(userId, 'admin');
	}

	async isProvider(userId: number): Promise<boolean> {
		return this.hasRole(userId, 'provider');
	}
}
