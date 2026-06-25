import type { APIRoute } from 'astro';
import { runHealthChecks } from '../../../lib/services/health/check';

export const GET: APIRoute = async ({ locals }) => {
  const health = await runHealthChecks(locals);
  const status = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
  return new Response(JSON.stringify(health), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
