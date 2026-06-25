import { eventsLog } from '../../database/schema';
import { eq, sql, desc, gte } from 'drizzle-orm';
import type { Database } from '../di/database';

export class AnalyticsService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getEventCounts(from?: Date) {
		const where = from
			? gte(eventsLog.createdAt, from)
			: undefined;

		const rows = await this.db
			.select({
				event: eventsLog.event,
				count: sql<number>`count(*)`,
			})
			.from(eventsLog)
			.where(where)
			.groupBy(eventsLog.event)
			.orderBy(desc(sql`count(*)`))
			.all();

		return rows;
	}

	async getEventsByDay(days = 30) {
		const from = new Date();
		from.setDate(from.getDate() - days);

		return await this.db
			.select({
				event: eventsLog.event,
				date: sql<string>`DATE(${eventsLog.createdAt})`,
				count: sql<number>`count(*)`,
			})
			.from(eventsLog)
			.where(gte(eventsLog.createdAt, from))
			.groupBy(sql`DATE(${eventsLog.createdAt})`, eventsLog.event)
			.orderBy(desc(sql`DATE(${eventsLog.createdAt})`))
			.all();
	}
}
