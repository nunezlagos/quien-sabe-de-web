import { eq, type SQL } from 'drizzle-orm';
import type { MySqlTableWithColumns } from 'drizzle-orm/mysql-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

type TableWithId<T extends MySqlTableWithColumns<any>> = T & { id: any };

function extractInsertId(raw: unknown): number {
	const header = Array.isArray(raw) ? raw[0] : raw;
	return Number((header as { insertId?: number } | null | undefined)?.insertId ?? 0);
}

export async function insertReturning<
	T extends TableWithId<MySqlTableWithColumns<any>>,
>(
	db: { insert: (t: T) => any; select: () => any },
	table: T,
	values: InferInsertModel<T>,
): Promise<InferSelectModel<T>> {
	const result = await db.insert(table).values(values);
	const insertId = extractInsertId(result);
	if (!insertId) {
		throw new Error(`insertReturning: INSERT did not return an insertId`);
	}
	const rows = await db.select().from(table).where(eq(table.id, insertId)).limit(1);
	return (rows as InferSelectModel<T>[])[0];
}

export async function updateReturning<
	T extends TableWithId<MySqlTableWithColumns<any>>,
>(
	db: { update: (t: T) => any; select: () => any },
	table: T,
	set: Partial<InferInsertModel<T>>,
	where: SQL,
): Promise<InferSelectModel<T> | undefined> {
	await db.update(table).set(set as any).where(where);
	const rows = await db.select().from(table).where(where).limit(1);
	return (rows as InferSelectModel<T>[])[0];
}

export async function deleteReturning<
	T extends TableWithId<MySqlTableWithColumns<any>>,
>(
	db: { delete: (t: T) => any; select: () => any },
	table: T,
	where: SQL,
): Promise<InferSelectModel<T> | undefined> {
	const rows = await db.select().from(table).where(where).limit(1);
	await db.delete(table).where(where);
	return (rows as InferSelectModel<T>[])[0];
}