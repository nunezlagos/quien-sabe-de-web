import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { contactEvents } from '../../../../database/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => ({}));
  const tradeId = Number(body.tradeId);
  const eventType = String(body.eventType || '');

  if (!tradeId || !['whatsapp', 'email', 'phone', 'profile'].includes(eventType)) {
    return new Response(null, { status: 204 });
  }

  const db = getDb(locals);
  const user = locals.user;

  await db.insert(contactEvents).values({
    tradeId,
    eventType: eventType as 'whatsapp' | 'email' | 'phone' | 'profile',
    userId: user?.id ?? null,
    visitorId: user ? null : String(body.visitorId || 'anonymous'),
  }).run();

  return new Response(null, { status: 204 });
};
