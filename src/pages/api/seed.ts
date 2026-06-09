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
      const locals = ctx.locals as any;
      const dbBinding = locals?.runtime?.env?.DB || locals?.DB;
      
      if (!dbBinding) {
          throw new Error('DB binding not found. Are you running with `wrangler` or `astro dev --host` with correct adapter config?');
      }

      const result = await seed(dbBinding);
      return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { 'Content-Type': 'application/json' }
      });
  } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
