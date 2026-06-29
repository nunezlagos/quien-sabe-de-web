import { getDb } from '../../database/client';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';

export const GET = async () => {
  try {
    const db = getDb();
    const [row] = await db.select().from(users).limit(1);
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      db_check: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
