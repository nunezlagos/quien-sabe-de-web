import { userViews, trades } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../di/database';

export class UserViewsService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async trackView(userId: number, tradeId: number): Promise<void> {
		const existing = await this.db
			.select({ id: userViews.id })
			.from(userViews)
			.where(and(
				eq(userViews.userId, userId),
				eq(userViews.tradeId, tradeId)
			))
			.get();

		if (existing) {
			await this.db.update(userViews)
				.set({ createdAt: new Date() })
				.where(eq(userViews.id, existing.id))
				.run();
		} else {
			await this.db.insert(userViews).values({
				userId,
				tradeId,
			}).run();
		}
	}

	async listRecentViews(userId: number, limit = 10) {
		return await this.db
			.select({
				id: userViews.id,
				tradeId: userViews.tradeId,
				tradeName: trades.name,
				tradeSlug: trades.slug,
				createdAt: userViews.createdAt,
			})
			.from(userViews)
			.innerJoin(trades, eq(userViews.tradeId, trades.id))
			.where(eq(userViews.userId, userId))
			.orderBy(desc(userViews.createdAt))
			.limit(limit)
			.all();
	}
}
