import { getDb } from '../../database/client';
import { trades } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';

export class TradesService {
  private db: ReturnType<typeof getDb>;

  constructor(context: any) {
    this.db = getDb(context);
  }

  async getAllTrades() {
    return await this.db.select().from(trades).orderBy(desc(trades.createdAt)).all();
  }

  async getTradeById(id: number) {
    const result = await this.db.select().from(trades).where(eq(trades.id, id)).get();
    return result || null;
  }

  async createTrade(data: { userId: number; symbol: string; entryPrice: number; exitPrice?: number; status?: 'open' | 'closed'; imageUrl?: string }) {
    return await this.db.insert(trades).values({
      userId: data.userId,
      symbol: data.symbol,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      status: data.status || 'open',
      imageUrl: data.imageUrl,
    }).returning().get();
  }
}

export const getTradesService = (context: any) => {
  return new TradesService(context);
};
