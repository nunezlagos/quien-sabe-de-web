import { eventsLog } from '../../database/schema';
import type { Database } from '../di/database';

export type EventType = 'signup' | 'search' | 'contact' | 'review' | 'donation' | 'ticket_open';
export type ActorRole = 'anonymous' | 'user' | 'provider' | 'admin';

export class EventTrackingService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async log(data: {
		event: EventType;
		actorRole: ActorRole;
		actorId?: number;
		props?: Record<string, unknown>;
	}) {
		await this.db.insert(eventsLog).values({
			event: data.event,
			actorRole: data.actorRole,
			propsJson: JSON.stringify(data.props ?? {}),
		}).run();
	}
}
