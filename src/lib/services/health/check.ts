import { getDb } from '../../../database/client';

interface HealthComponent {
  status: 'ok' | 'down' | 'timeout';
  latencyMs: number;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  components: {
    d1: HealthComponent;
  };
}

export async function runHealthChecks(locals: any): Promise<HealthResponse> {
  const start = Date.now();
  let d1Status: HealthComponent = { status: 'ok', latencyMs: 0 };

  try {
    const db = getDb(locals);
    await db.run('SELECT 1');
    d1Status.latencyMs = Date.now() - start;
  } catch {
    d1Status = { status: 'down', latencyMs: Date.now() - start };
  }

  const allOk = d1Status.status === 'ok';
  const anyOk = d1Status.status === 'ok';

  return {
    status: allOk ? 'ok' : anyOk ? 'degraded' : 'down',
    timestamp: new Date().toISOString(),
    components: { d1: d1Status },
  };
}

export async function checkMigrationsCurrent(locals: any): Promise<boolean> {
  try {
    const db = getDb(locals);
    const result = await db.run('SELECT COUNT(*) as c FROM drizzle_migrations');
    return true;
  } catch {
    return false;
  }
}
