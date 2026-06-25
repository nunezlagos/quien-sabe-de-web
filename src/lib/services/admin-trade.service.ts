import { trades, communes, users } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../di/database';

export class AdminTradeService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async list() {
		return await this.db
			.select({
				id: trades.id,
				slug: trades.slug,
				symbol: trades.symbol,
				name: trades.name,
				verified: trades.verified,
				status: trades.status,
				category: trades.category,
				communeName: communes.name,
				userName: users.name,
				createdAt: trades.createdAt,
			})
			.from(trades)
			.leftJoin(communes, eq(trades.communeId, communes.id))
			.leftJoin(users, eq(trades.userId, users.id))
			.orderBy(desc(trades.createdAt))
			.all();
	}

	async verify(tradeId: number): Promise<void> {
		await this.db.update(trades)
			.set({ verified: true })
			.where(eq(trades.id, tradeId))
			.run();
	}

	async suspend(tradeId: number): Promise<void> {
		await this.db.update(trades)
			.set({ status: 'paused' })
			.where(eq(trades.id, tradeId))
			.run();
	}

	async activate(tradeId: number): Promise<void> {
		await this.db.update(trades)
			.set({ status: 'active' })
			.where(eq(trades.id, tradeId))
			.run();
	}
}
