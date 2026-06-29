import { expenses } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../di/database';
import { insertReturning, updateReturning } from '../db/returning';

export class ExpenseService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async list() {
		return await this.db
			.select()
			.from(expenses)
			.orderBy(desc(expenses.createdAt))
			.all();
	}

	async getById(id: number) {
		return await this.db
			.select()
			.from(expenses)
			.where(eq(expenses.id, id))
			.get() || null;
	}

	async create(data: {
		description: string;
		amountClp: number;
		category: 'hosting' | 'dominio' | 'marketing' | 'legal' | 'herramientas' | 'otros';
		receiptUrl?: string;
		createdBy?: number;
	}) {
		return await insertReturning(this.db, expenses, data);
	}

	async update(id: number, data: Partial<{
		description: string;
		amountClp: number;
		category: 'hosting' | 'dominio' | 'marketing' | 'legal' | 'herramientas' | 'otros';
		receiptUrl: string;
	}>) {
		return await updateReturning(this.db, expenses, data, eq(expenses.id, id));
	}

	async delete(id: number): Promise<void> {
		await this.db.delete(expenses).where(eq(expenses.id, id)).run();
	}
}
