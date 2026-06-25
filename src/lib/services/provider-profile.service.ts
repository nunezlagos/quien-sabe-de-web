import { trades, communes, reviews, users } from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { Database } from '../di/database';

export class ProviderProfileService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getProfile(tradeId: number) {
		return await this.db
			.select({
				id: trades.id,
				slug: trades.slug,
				symbol: trades.symbol,
				name: trades.name,
				description: trades.description,
				basePriceClp: trades.basePriceClp,
				whatsapp: trades.whatsapp,
				imageUrl: trades.imageUrl,
				verified: trades.verified,
				availableNow: trades.availableNow,
				status: trades.status,
				category: trades.category,
				communeName: communes.name,
				userName: users.name,
				userAvatar: users.avatarUrl,
			})
			.from(trades)
			.leftJoin(communes, eq(trades.communeId, communes.id))
			.leftJoin(users, eq(trades.userId, users.id))
			.where(eq(trades.id, tradeId))
			.get() || null;
	}

	async getProfileBySlug(slug: string) {
		return await this.db
			.select({
				id: trades.id,
				slug: trades.slug,
				symbol: trades.symbol,
				name: trades.name,
				description: trades.description,
				basePriceClp: trades.basePriceClp,
				whatsapp: trades.whatsapp,
				imageUrl: trades.imageUrl,
				verified: trades.verified,
				availableNow: trades.availableNow,
				status: trades.status,
				category: trades.category,
				communeName: communes.name,
				userName: users.name,
				userAvatar: users.avatarUrl,
			})
			.from(trades)
			.leftJoin(communes, eq(trades.communeId, communes.id))
			.leftJoin(users, eq(trades.userId, users.id))
			.where(eq(trades.slug, slug))
			.get() || null;
	}

	async getRatingSummary(tradeId: number): Promise<{ avg: number; count: number }> {
		const row = await this.db
			.select({
				avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
				count: sql<number>`COUNT(*)`,
			})
			.from(reviews)
			.where(eq(reviews.tradeId, tradeId))
			.get();
		return {
			avg: Number(row?.avg ?? 0),
			count: Number(row?.count ?? 0),
		};
	}

	async getReviews(tradeId: number) {
		return await this.db
			.select()
			.from(reviews)
			.where(eq(reviews.tradeId, tradeId))
			.orderBy(desc(reviews.createdAt))
			.all();
	}
}
