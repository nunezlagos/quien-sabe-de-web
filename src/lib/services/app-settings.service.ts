import { appSettings } from '../../database/schema';
import { eq } from 'drizzle-orm';
import type { Database } from '../di/database';

export class AppSettingsService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async get(key: string): Promise<string | null> {
		const result = await this.db
			.select({ value: appSettings.value })
			.from(appSettings)
			.where(eq(appSettings.key, key))
			.get();
		return result?.value ?? null;
	}

	async set(key: string, value: string): Promise<void> {
		await this.db.insert(appSettings)
			.values({ key, value })
			.onConflictDoUpdate({ target: appSettings.key, set: { value } })
			.run();
	}

	async delete(key: string): Promise<void> {
		await this.db.delete(appSettings).where(eq(appSettings.key, key)).run();
	}
}
