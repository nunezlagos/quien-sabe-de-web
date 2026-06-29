import { verificationDocuments } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { Database } from '../di/database';
import { insertReturning } from '../db/returning';

export class VerificationDocumentService {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async listForUser(userId: number) {
		return await this.db
			.select()
			.from(verificationDocuments)
			.where(eq(verificationDocuments.userId, userId))
			.orderBy(desc(verificationDocuments.createdAt))
			.all();
	}

	async create(data: {
		userId: number;
		kind: 'cedula' | 'certificado' | 'comprobante' | 'otro';
		objectKey: string;
		contentType: string;
	}) {
		return await insertReturning(this.db, verificationDocuments, {
			userId: data.userId,
			kind: data.kind,
			objectKey: data.objectKey,
			contentType: data.contentType,
			uploadedAt: new Date(),
		});
	}
}
