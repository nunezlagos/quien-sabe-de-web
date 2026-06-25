import { portfolioImages, trades } from '../../database/schema';
import { eq, asc, count, and, desc } from 'drizzle-orm';
import type { Database } from '../di/database';

export class PortfolioService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async listImages(tradeId: number) {
		return await this.db
			.select({
				id: portfolioImages.id,
				tradeId: portfolioImages.tradeId,
				url: portfolioImages.url,
				caption: portfolioImages.caption,
				sortOrder: portfolioImages.sortOrder,
				createdAt: portfolioImages.createdAt,
			})
			.from(portfolioImages)
			.where(eq(portfolioImages.tradeId, tradeId))
			.orderBy(asc(portfolioImages.sortOrder))
			.all();
	}

	async getImageById(imageId: number) {
		return await this.db
			.select()
			.from(portfolioImages)
			.where(eq(portfolioImages.id, imageId))
			.get() || null;
	}

	async uploadImage(data: {
		tradeId: number;
		url: string;
		caption?: string | null;
	}) {
		const countResult = await this.db
			.select({ c: count() })
			.from(portfolioImages)
			.where(eq(portfolioImages.tradeId, data.tradeId))
			.get();

		const nextOrder = (countResult?.c ?? 0);

		return await this.db.insert(portfolioImages).values({
			tradeId: data.tradeId,
			url: data.url,
			caption: data.caption,
			sortOrder: nextOrder,
		}).returning().get();
	}

	async updateCaption(imageId: number, caption: string): Promise<void> {
		await this.db.update(portfolioImages)
			.set({ caption })
			.where(eq(portfolioImages.id, imageId))
			.run();
	}

	async deleteImage(imageId: number): Promise<void> {
		await this.db.delete(portfolioImages)
			.where(eq(portfolioImages.id, imageId))
			.run();
	}
}
