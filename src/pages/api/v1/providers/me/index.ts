import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { users, trades } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }
  if (user.role !== 'provider' && user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Solo proveedores' }), { status: 403 });
  }

  const formData = await request.formData();
  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const whatsappRaw = (formData.get('whatsapp') as string)?.trim();

  const db = getDb(locals);
  const errors: string[] = [];

  if (!name || name.length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: errors.join(', ') }), { status: 400 });
  }

  await db.update(users).set({ name }).where(eq(users.id, user.id)).run();

  const userTrades = await db
    .select({ id: trades.id })
    .from(trades)
    .where(eq(trades.userId, user.id))
    .limit(1)
    .all();

  if (userTrades.length > 0) {
    const tradeId = userTrades[0].id;
    const updateData: Record<string, string> = {};
    if (description) updateData.description = description;
    if (whatsappRaw && /^[0-9]{8}$/.test(whatsappRaw)) {
      updateData.whatsapp = `569${whatsappRaw}`;
    }
    if (Object.keys(updateData).length > 0) {
      await db.update(trades).set(updateData).where(eq(trades.id, tradeId)).run();
    }
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/dashboard-prestador?perfil=actualizado' },
  });
};
