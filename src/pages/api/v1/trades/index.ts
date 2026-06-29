import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { trades, tradeCommunes } from '../../../../database/schema';
import { slugify } from '../../../../lib/utils/slug';
import { eq } from 'drizzle-orm';
import { searchTrades } from '../../../../api/v1/controllers/trades.controller';
import { CreateTradeBody } from '../../../../lib/validators/trades';
import { insertReturning } from '../../../../lib/db/returning';

export const prerender = false;

export const GET: APIRoute = searchTrades;

export const POST: APIRoute = async (ctx) => {
  const currentUser = ctx.locals.user;
  if (!currentUser) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/iniciar-sesion?redirigir=/crear-oficio' },
    });
  }

  const formData = await ctx.request.formData();
  const body = Object.fromEntries(formData.entries());
  const parsed = CreateTradeBody.safeParse(body);

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
  const db = getDb();

  let slugFinal = baseSlug;
  let suffix = 1;
  while (await db.select().from(trades).where(eq(trades.slug, slugFinal)).get()) {
    suffix += 1;
    slugFinal = `${baseSlug}-${suffix}`;
  }

  // Almacenamos WhatsApp en formato E.164-like sin el '+': 569XXXXXXXX (11 dígitos).
  // El wizard muestra "+56 9" como prefijo visual y el currentUser tipea los 8 dígitos
  // restantes; acá anteponemos "569" para tener el número completo.
  const fullWhatsapp = `569${whatsapp}`;

  const newTrade = await insertReturning(db, trades, {
    userId: currentUser.id,
    symbol: symbolFinal,
    name,
    slug: slugFinal,
    description,
    basePriceClp: base_price_clp,
    whatsapp: fullWhatsapp,
    verified: false,
    status: 'active',
  });

  // Save commune coverage
  const rawCommuneIds = formData.getAll('commune_ids') as string[];
  const communeIds = rawCommuneIds.map(Number).filter((id) => id > 0);
  if (communeIds.length > 0) {
    await db.insert(tradeCommunes).values(
      communeIds.map((communeId) => ({ tradeId: newTrade.id, communeId }))
    ).run();
  }

  return new Response(null, {
    status: 302,
    headers: { Location: `/verificar-oficio?slug=${newTrade.slug}&ok=1` },
  });
};
