import type { APIRoute } from 'astro';
import { checkMigrationsCurrent } from '../../../lib/services/health/check';

export const GET: APIRoute = async ({ locals }) => {
  const migrationsOk = await checkMigrationsCurrent(locals);
  if (migrationsOk) {
    return new Response(JSON.stringify({ ready: true, version: '1.0.0', migrationsCurrent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  return new Response(JSON.stringify({ ready: false, reason: 'migrations_pending' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
