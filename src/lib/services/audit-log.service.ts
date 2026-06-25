import { adminAuditLog, users } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../di/database';

export class AuditLogService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async log(data: {
		adminId: number;
		action: string;
		entityType?: string;
		entityId?: number;
		details?: string;
	}) {
		await this.db.insert(adminAuditLog).values(data).run();
	}

	async listForEntity(entityType: string, entityId: number) {
		return await this.db
			.select({
				id: adminAuditLog.id,
				adminId: adminAuditLog.adminId,
				action: adminAuditLog.action,
				entityType: adminAuditLog.entityType,
				entityId: adminAuditLog.entityId,
				details: adminAuditLog.details,
				createdAt: adminAuditLog.createdAt,
				adminName: users.name,
			})
			.from(adminAuditLog)
			.leftJoin(users, eq(adminAuditLog.adminId, users.id))
			.where(eq(adminAuditLog.entityId, entityId))
			.orderBy(desc(adminAuditLog.createdAt))
			.all();
	}
}
