import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDb } from '../../../../database/client';
import { trades } from '../../../../database/schema';
import { slugify } from '../../../../lib/utils/slug';
import { eq, and } from 'drizzle-orm';
import { searchTrades } from '../../../../api/v1/controllers/trades.controller';

export const prerender = false;

export const GET: APIRoute = searchTrades;

const crearTradeSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  symbol: z.string().trim().min(1).max(50),
  description: z.string().trim().min(20, 'La descripción debe tener al menos 20 caracteres').max(1000),
  commune_id: z.coerce.number().int().positive(),
  base_price_clp: z.coerce.number().int().min(1000, 'Precio mínimo $1.000 CLP').max(9_999_999),
});

export const POST: APIRoute = async (ctx) => {
  const usuario = ctx.locals.user;
  if (!usuario) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/iniciar-sesion?redirigir=/crear-oficio' },
    });
  }

  // Parse form data
  const formData = await ctx.request.formData();
  const body = Object.fromEntries(formData.entries());
  const parsed = crearTradeSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorMsg = encodeURIComponent(firstIssue?.message ?? 'datos inválidos');
    return new Response(null, {
      status: 302,
      headers: { Location: `/crear-oficio?error=${errorMsg}` },
    });
  }

  const { name, symbol, description, commune_id, base_price_clp } = parsed.data;

  // Generar slug único basado en nombre + symbol
  const baseSlug = slugify(`${symbol}-${name}`);
  const db = getDb(ctx.locals);

  // Verificar unicidad del slug
  let slugFinal = baseSlug;
  let suffix = 1;
  while (await db.select().from(trades).where(eq(trades.slug, slugFinal)).get()) {
    suffix += 1;
    slugFinal = `${baseSlug}-${suffix}`;
  }

  // Crear trade
  const nuevoTrade = await db
    .insert(trades)
    .values({
      userId: usuario.id,
      symbol,
      name,
      slug: slugFinal,
      description,
      basePriceClp: base_price_clp,
      communeId: commune_id,
      verified: false,
      status: 'active',
    })
    .returning()
    .get();

  return new Response(null, {
    status: 302,
    headers: { Location: `/p/${nuevoTrade.slug}` },
  });
};