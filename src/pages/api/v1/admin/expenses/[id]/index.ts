import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { expenses } from '../../../../../../database/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  const id = Number(params.id);
  if (!id) return errorResponse('ID inválido', 400);

  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const db = getDb();
  const existing = await db.select().from(expenses).where(eq(expenses.id, id)).get();
  if (!existing) return errorResponse('Gasto no encontrado', 404);

  const update: Record<string, any> = {};
  if (body.description) update.description = body.description;
  if (body.amountClp) update.amountClp = body.amountClp;
  if (body.category) update.category = body.category;
  if (body.receiptUrl !== undefined) update.receiptUrl = body.receiptUrl;

  await db.update(expenses).set(update).where(eq(expenses.id, id)).run();
  return jsonResponse({ ok: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  const id = Number(params.id);
  if (!id) return errorResponse('ID inválido', 400);

  const db = getDb();
  await db.delete(expenses).where(eq(expenses.id, id)).run();
  return jsonResponse({ ok: true });
};
