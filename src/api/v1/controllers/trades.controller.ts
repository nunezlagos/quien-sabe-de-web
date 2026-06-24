import type { APIContext } from 'astro';
import { getTradesService } from '../../../lib/services/trades.service';
import { successResponse, errorResponse } from '../../../lib/utils/response';
import { z } from 'zod';

const createTradeSchema = z.object({
  userId: z.number({ message: "User ID is required" }),
  symbol: z.string({ message: "Symbol is required" }).min(1, "Symbol cannot be empty"),
  entryPrice: z.number({ message: "Entry price is required" }).positive("Entry price must be positive"),
  exitPrice: z.number().positive().optional(),
  status: z.enum(['open', 'closed']).optional(),
  imageUrl: z.string().url().optional(),
});

export const listTrades = async (ctx: APIContext) => {
  try {
    const service = getTradesService(ctx);
    const trades = await service.getAllTrades();
    return successResponse(trades);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
};

export const createTrade = async (ctx: APIContext) => {
  try {
    const service = getTradesService(ctx);
    const body = await ctx.request.json();
    
    const result = createTradeSchema.safeParse(body);

    if (!result.success) {
        const errorMessages = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        return errorResponse(errorMessages, 400);
    }

    const tradeData = result.data;

    const createdTrade = await service.createTrade({
        userId: tradeData.userId,
        symbol: tradeData.symbol,
        entryPrice: tradeData.entryPrice,
        exitPrice: tradeData.exitPrice,
        status: tradeData.status,
        imageUrl: tradeData.imageUrl
    });

    return successResponse(createdTrade, 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
};
