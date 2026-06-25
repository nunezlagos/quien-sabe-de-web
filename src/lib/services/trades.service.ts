import { trades, communes, reviews, users } from '../../database/schema';
import { eq, desc, sql, like, and, or, gte } from 'drizzle-orm';
import type { Database } from '../di/database';

/**
 * Servicio de oficios (trades).
 * En esta app "trade" = servicio que ofrece un vecino (gasfiter, electricista, etc.)
 */
export class TradesService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getAllTrades() {
		return await this.db.select().from(trades).orderBy(desc(trades.createdAt)).all();
	}

	async getTradeById(id: number) {
		const result = await this.db.select().from(trades).where(eq(trades.id, id)).get();
		return result || null;
	}

	async getTradeBySlug(slug: string) {
		const result = await this.db.select().from(trades).where(eq(trades.slug, slug)).get();
		return result || null;
	}

	async createTrade(data: {
		userId: number;
		symbol: string;
		name: string;
		slug: string;
		description?: string;
		basePriceClp?: number;
		whatsapp?: string;
		communeId?: number;
		category?: 'hogar' | 'tecnologia' | 'automotriz' | 'educacion' | 'salud_belleza' | 'otros';
	}) {
		return await this.db.insert(trades).values({
			userId: data.userId,
			symbol: data.symbol,
			name: data.name,
			slug: data.slug,
			description: data.description,
			basePriceClp: data.basePriceClp,
			whatsapp: data.whatsapp,
			communeId: data.communeId,
			category: data.category || 'hogar',
			verified: false,
			status: 'active',
		}).returning().get();
	}

	/**
	 * Búsqueda MVP: por texto libre (symbol/name/description) y comuna opcional.
	 * HU-06.1-endpoint-search-base.
	 */
	async search(params: {
		q?: string;
		communeId?: number;
		category?: string;
		availableNow?: boolean;
		limit?: number;
	}) {
		const conditions = [];

		if (params.q && params.q.trim().length > 0) {
			const needle = `%${params.q.trim().toLowerCase()}%`;
			conditions.push(
				or(
					like(sql`lower(${trades.symbol})`, needle),
					like(sql`lower(${trades.name})`, needle),
					like(sql`lower(${trades.description})`, needle),
				)!
			);
		}
		if (params.communeId) {
			conditions.push(eq(trades.communeId, params.communeId));
		}
		if (params.category) {
			conditions.push(eq(trades.category, params.category as 'hogar' | 'tecnologia' | 'automotriz' | 'educacion' | 'salud_belleza' | 'otros'));
		}
		if (params.availableNow) {
			conditions.push(eq(trades.availableNow, true));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const limit = params.limit ?? 20;

		const rows = await this.db
			.select({
				id: trades.id,
				slug: trades.slug,
				symbol: trades.symbol,
				name: trades.name,
				description: trades.description,
				basePriceClp: trades.basePriceClp,
				imageUrl: trades.imageUrl,
				verified: trades.verified,
				availableNow: trades.availableNow,
				status: trades.status,
				category: trades.category,
				communeId: trades.communeId,
				communeName: communes.name,
				userId: trades.userId,
				userName: users.name,
				userAvatar: users.avatarUrl,
			})
			.from(trades)
			.leftJoin(communes, eq(trades.communeId, communes.id))
			.leftJoin(users, eq(trades.userId, users.id))
			.where(where)
			.orderBy(desc(trades.verified), desc(trades.createdAt))
			.limit(limit)
			.all();

		return rows;
	}

	async getReviewsForTrade(tradeId: number) {
		return await this.db
			.select()
			.from(reviews)
			.where(eq(reviews.tradeId, tradeId))
			.orderBy(desc(reviews.createdAt))
			.all();
	}

	async getAverageRating(tradeId: number): Promise<{ avg: number; count: number }> {
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
}

import { getDb } from '../../database/client';

export const getTradesService = (context: unknown) => {
	return new TradesService(getDb(context));
};