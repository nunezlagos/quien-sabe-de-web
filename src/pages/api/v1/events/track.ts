import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { eventsLog } from '../../../../database/schema';
import * as z from 'zod/v4';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

const EVENT_ALLOWLIST = ['signup', 'search', 'contact', 'review', 'donation', 'ticket_open'] as const;
const ROLES = ['anonymous', 'user', 'provider', 'admin'] as const;
const PII_REGEX = /[\w.\-]+@[\w.\-]+\.\w+|(\+?56)?\d{9,}|\b\d{1,2}\.\d{3}\.\d{3}[-]\w\b/;

const trackSchema = z.object({
  event: z.enum(EVENT_ALLOWLIST),
  props: z.record(z.string(), z.unknown()).optional().default({}),
});

export const POST: APIRoute = async ({ request, locals }) => {
  let body: any;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(i => i.message).join(', '), 422);

  const serialized = JSON.stringify(parsed.data.props);
  if (PII_REGEX.test(serialized)) return errorResponse('Props contienen datos sensibles', 422);

  const user = (locals as any).user;
  const actorRole = !user ? 'anonymous' : user.role === 'admin' ? 'admin' : user.role === 'provider' ? 'provider' : 'user';

  const db = getDb();
  await db.insert(eventsLog).values({
    event: parsed.data.event as any,
    actorRole: actorRole as any,
    propsJson: serialized,
  }).run();

  return new Response(null, { status: 204 });
};
