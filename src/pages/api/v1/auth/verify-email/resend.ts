import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { users } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';
import { sendMail, buildVerificationEmail } from '../../../../lib/services/email/mailpit';
import crypto from 'crypto';

export const POST: APIRoute = async ({ locals }) => {
  const currentUser = locals.currentUser;
  if (!currentUser) return errorResponse('No autorizado', 401);
  if (currentUser.emailVerified) return errorResponse('Email ya verificado', 400);

  const db = await getDb();
  const token = crypto.randomBytes(32).toString('hex');
  await db.update(users).set({ emailVerificationToken: token }).where(eq(users.id, currentUser.id)).run();

  const siteUrl = (locals as any).runtime?.env?.PUBLIC_SITE_URL || 'http://127.0.0.1:4323';
  sendMail(buildVerificationEmail(currentUser.email, token, siteUrl));

  return jsonResponse({ ok: true, mensaje: 'Correo de verificación reenviado' });
};
