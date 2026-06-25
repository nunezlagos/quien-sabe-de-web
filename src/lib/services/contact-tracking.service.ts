import { contactEvents } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import type { Database } from '../di/database';

export class ContactTrackingService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async trackEvent(data: {
		tradeId: number;
		visitorId?: string;
		userId?: number;
		eventType: 'whatsapp' | 'email' | 'phone' | 'profile';
	}) {
		await this.db.insert(contactEvents).values({
			tradeId: data.tradeId,
			visitorId: data.visitorId,
			userId: data.userId,
			eventType: data.eventType,
		}).run();
	}
}
