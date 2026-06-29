import type { APIRoute } from 'astro';
import { getDb } from '../../../database/client';
import { listCommunes } from '../../../lib/services/communes';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const q = url.searchParams.get('q') ?? undefined;
    const db = getDb();
    const rows = await listCommunes(db, q);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    console.error('GET /api/v1/communes failed', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
};
