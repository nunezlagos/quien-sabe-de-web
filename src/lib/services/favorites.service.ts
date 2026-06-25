import { favorites, trades, users } from '../../database/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import type { Database } from '../di/database';

export class FavoriteService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async listFavorites(userId: number) {
		return await this.db
			.select({
				id: favorites.id,
				tradeId: favorites.tradeId,
				createdAt: favorites.createdAt,
				tradeName: trades.name,
				tradeSlug: trades.slug,
				tradeSymbol: trades.symbol,
				tradePrice: trades.basePriceClp,
				tradeVerified: trades.verified,
			})
			.from(favorites)
			.innerJoin(trades, eq(favorites.tradeId, trades.id))
			.where(eq(favorites.userId, userId))
			.orderBy(desc(favorites.createdAt))
			.all();
	}

	async isFavorited(userId: number, tradeId: number): Promise<boolean> {
		const result = await this.db
			.select({ id: favorites.id })
			.from(favorites)
			.where(and(
				eq(favorites.userId, userId),
				eq(favorites.tradeId, tradeId)
			))
			.get();
		return Boolean(result);
	}

	async toggle(userId: number, tradeId: number): Promise<{ added: boolean }> {
		const existing = await this.isFavorited(userId, tradeId);
		if (existing) {
			await this.db.delete(favorites)
				.where(and(
					eq(favorites.userId, userId),
					eq(favorites.tradeId, tradeId)
				))
				.run();
			return { added: false };
		} else {
			await this.db.insert(favorites).values({ userId, tradeId }).run();
			return { added: true };
		}
	}
}
