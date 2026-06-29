import { reviews, trades } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../di/database';
import { insertReturning } from '../db/returning';

export class TradeReviewService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async createReview(data: {
		tradeId: number;
		userId?: number;
		reviewerName: string;
		rating: number;
		body: string;
	}) {
		return await insertReturning(this.db, reviews, {
			tradeId: data.tradeId,
			userId: data.userId,
			reviewerName: data.reviewerName,
			rating: data.rating,
			body: data.body,
		});
	}

	async getReviewById(reviewId: number) {
		return await this.db
			.select()
			.from(reviews)
			.where(eq(reviews.id, reviewId))
			.get() || null;
	}

	async addResponse(reviewId: number, response: string): Promise<void> {
		await this.db.update(reviews)
			.set({
				response,
				respondedAt: new Date(),
			})
			.where(eq(reviews.id, reviewId))
			.run();
	}

	async getReviewsForTrade(tradeId: number) {
		return await this.db
			.select()
			.from(reviews)
			.where(eq(reviews.tradeId, tradeId))
			.orderBy(desc(reviews.createdAt))
			.all();
	}
}
