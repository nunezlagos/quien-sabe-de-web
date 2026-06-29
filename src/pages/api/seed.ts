import type { APIRoute } from 'astro';
import { seed } from '../../database/seed';

export const POST: APIRoute = async (ctx) => {
  const isDev = import.meta.env.DEV;
  const authHeader = ctx.request.headers.get('Authorization');
  const secret = import.meta.env.SEED_SECRET;
  
  if (!secret) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: SEED_SECRET not set' }), { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
      const result = await seed();
      return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { 'Content-Type': 'application/json' }
      });
  } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
