import type { APIRoute } from 'astro';
import { getDb } from '../../../../../../database/client';
import { users, communes } from '../../../../../../database/schema';
import { eq } from 'drizzle-orm';
import * as z from 'zod/v4';
import { errorResponse, jsonResponse } from '../../../../../../lib/utils/response';

export const prerender = false;

const profilePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  communeId: z.number().int().positive().optional(),
  interests: z.string().max(500).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
});

const onboardingSchema = z.object({
  communeId: z.number({ message: 'Selecciona una comuna' }).int().positive(),
  acceptedTerms: z.literal(true, { message: 'Debes aceptar los términos' }),
  interests: z.string().max(500).optional(),
});

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  const db = getDb(locals);
  const u = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      communeId: users.communeId,
      interests: users.interests,
      onboardedAt: users.onboardedAt,
      communeName: communes.name,
    })
    .from(users)
    .leftJoin(communes, eq(users.communeId, communes.id))
    .where(eq(users.id, user.id))
    .get();

  return jsonResponse(u ?? {});
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    const msgs = parsed.error.issues.map(i => i.message).join(', ');
    return errorResponse(msgs, 422);
  }

  const db = getDb(locals);
  await db.update(users).set(parsed.data).where(eq(users.id, user.id)).run();

  return jsonResponse({ ok: true });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return errorResponse('No autorizado', 401);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('JSON inválido', 400); }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    const msgs = parsed.error.issues.map(i => i.message).join(', ');
    return errorResponse(msgs, 422);
  }

  if (user.role !== 'user') {
    return errorResponse('Solo vecinos pueden completar onboarding', 403);
  }

  const db = getDb(locals);
  await db
    .update(users)
    .set({
      communeId: parsed.data.communeId,
      interests: parsed.data.interests ?? null,
      acceptedTermsAt: new Date(),
      onboardedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .run();

  return jsonResponse({ ok: true });
};
