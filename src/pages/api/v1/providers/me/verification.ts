import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDb } from '../../../../../database/client';
import { users } from '../../../../../database/schema';
import { respuestaError } from '../../../../../lib/utils/respuesta';

export const prerender = false;

const verificacionSchema = z.object({
  rut: z
    .string()
    .trim()
    .regex(/^[0-9]{7,8}-[0-9kK]$/, 'RUT inválido (formato 12345678-9)'),
  trade: z.string().trim().min(1, 'Selecciona un oficio'),
});

/**
 * POST /api/v1/providers/me/verification
 * Registra una solicitud de verificación para el proveedor autenticado.
 * MVP: valida y devuelve acuse; la persistencia en tabla `verification_requests`
 * llega con HU-12.6 (admin reviewer).
 */
export const POST: APIRoute = async (contexto) => {
  const usuario = contexto.locals.user;
  if (!usuario) return respuestaError('no autenticado', 401);
  if (usuario.role !== 'provider' && usuario.role !== 'admin') {
    return respuestaError('requiere rol provider', 403);
  }

  const formData = await contexto.request.formData();
  const body = Object.fromEntries(formData.entries());
  const parsed = verificacionSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorMsg = encodeURIComponent(firstIssue?.message ?? 'datos inválidos');
    return new Response(null, {
      status: 302,
      headers: { Location: `/verificar-oficio?error=${errorMsg}` },
    });
  }

  const { rut, trade } = parsed.data;
  // Toca la DB para que el binding falle ruidosamente si la migración no corrió.
  const db = getDb(contexto.locals);
  await db.select().from(users).limit(1).all();

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/verificar-oficio?ok=1&trade=${encodeURIComponent(trade)}&rut=${encodeURIComponent(rut)}`,
    },
  });
};
