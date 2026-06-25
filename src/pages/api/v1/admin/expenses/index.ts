import type { APIRoute } from 'astro';
import { getDb } from '../../../../../database/client';
import { expenses } from '../../../../../database/schema';
import { eq, desc } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';
import * as z from 'zod/v4';

const expenseSchema = z.object({
  description: z.string().min(3).max(500),
  amountClp: z.number().int().positive(),
  category: z.enum(['hosting', 'dominio', 'marketing', 'legal', 'herramientas', 'otros']),
  receiptUrl: z.string().url().optional(),
});

export const GET: APIRoute = async ({ locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);
  const db = getDb(locals);
  const items = await db.select().from(expenses).orderBy(desc(expenses.createdAt)).all();
  return jsonResponse(items);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const db = getDb(locals);
  const { lastInsertRowid } = await db.insert(expenses).values({ ...parsed.data, createdBy: user.id }).run();

  return jsonResponse({ id: Number(lastInsertRowid) }, { status: 201 });
};
