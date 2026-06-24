import type { APIContext } from 'astro';
import { getTradesService } from '../../../lib/services/trades.service';
import { errorResponse, jsonResponse } from '../../../lib/utils/response';

export const listTrades = async (ctx: APIContext) => {
  try {
    const servicio = getTradesService(ctx);
    const trades = await servicio.getAllTrades();
    return jsonResponse(trades);
  } catch (err: any) {
    console.error('listTrades failed', err);
    return errorResponse(err.message || 'internal_error', 500);
  }
};

export const searchTrades = async (ctx: APIContext) => {
  try {
    const q = ctx.url.searchParams.get('q') ?? undefined;
    const communeIdParam = ctx.url.searchParams.get('commune_id');
    const communeId = communeIdParam ? Number.parseInt(communeIdParam, 10) : undefined;
    const category = ctx.url.searchParams.get('category') ?? undefined;
    const limitParam = ctx.url.searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;

    const servicio = getTradesService(ctx);
    const resultados = await servicio.search({ q, communeId, category, limit });
    return jsonResponse({ resultados, total: resultados.length });
  } catch (err: any) {
    console.error('searchTrades failed', err);
    return errorResponse(err.message || 'internal_error', 500);
  }
};

export const getTradeBySlug = async (ctx: APIContext) => {
  try {
    const slug = ctx.params.slug;
    if (!slug) return errorResponse('slug requerido', 400);

    const servicio = getTradesService(ctx);
    const trade = await servicio.getTradeBySlug(slug);
    if (!trade) return errorResponse('no encontrado', 404);

    const reviews = await servicio.getReviewsForTrade(trade.id);
    const rating = await servicio.getAverageRating(trade.id);

    return jsonResponse({ trade, reviews, rating });
  } catch (err: any) {
    console.error('getTradeBySlug failed', err);
    return errorResponse(err.message || 'internal_error', 500);
  }
};