import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getDb } from '../../../../database/client';
import { trades } from '../../../../database/schema';
import { slugify } from '../../../../lib/utils/slug';
import { eq } from 'drizzle-orm';
import { searchTrades } from '../../../../api/v1/controllers/trades.controller';

export const prerender = false;

export const GET: APIRoute = searchTrades;

const OFICIOS_CONOCIDOS = [
  'gasfiter',
  'electricista',
  'jardinero',
  'pintor',
  'costurera',
  'programador',
  'maestro',
  'otro',
] as const;

const crearTradeSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  symbol: z.enum(OFICIOS_CONOCIDOS).optional(),
  symbol_custom: z.string().trim().max(30).optional(),
  description: z.string().trim().min(20, 'La descripción debe tener al menos 20 caracteres').max(1000),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{8}$/, 'WhatsApp debe tener 8 dígitos (formato 9XXXXXXXX sin el 9 inicial)'),
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

  const formData = await ctx.request.formData();
  const body = Object.fromEntries(formData.entries());
  const parsed = crearTradeSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorMsg = encodeURIComponent(firstIssue?.message ?? 'datos inválidos');
    return new Response(null, {
      status: 302,
      headers: { Location: `/crear-oficio?paso=3&error=${errorMsg}` },
    });
  }

  const { name, description, whatsapp, base_price_clp, symbol, symbol_custom } = parsed.data;

  // symbol: prioridad = symbol_custom (si "otro") > symbol (select) > derivado del name.
  let symbolFinal: string;
  if (symbol === 'otro' && symbol_custom && symbol_custom.trim().length > 0) {
    symbolFinal = slugify(symbol_custom).slice(0, 30) || 'servicio';
  } else if (symbol) {
    symbolFinal = symbol;
  } else {
    const primerSlug = slugify(name).split('-').filter(Boolean)[0] ?? 'servicio';
    symbolFinal = primerSlug.slice(0, 30) || 'servicio';
  }

  const baseSlug = slugify(`${symbolFinal}-${name}`);
  const db = getDb(ctx.locals);

  let slugFinal = baseSlug;
  let suffix = 1;
  while (await db.select().from(trades).where(eq(trades.slug, slugFinal)).get()) {
    suffix += 1;
    slugFinal = `${baseSlug}-${suffix}`;
  }

  // Almacenamos WhatsApp en formato E.164-like sin el '+': 569XXXXXXXX (11 dígitos).
  // El wizard muestra "+56 9" como prefijo visual y el usuario tipea los 8 dígitos
  // restantes; acá anteponemos "569" para tener el número completo.
  const whatsappCompleto = `569${whatsapp}`;

  const nuevoTrade = await db
    .insert(trades)
    .values({
      userId: usuario.id,
      symbol: symbolFinal,
      name,
      slug: slugFinal,
      description,
      basePriceClp: base_price_clp,
      whatsapp: whatsappCompleto,
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
