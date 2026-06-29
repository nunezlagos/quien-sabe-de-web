import { getDb } from '../../../database/client';
import { sql } from 'drizzle-orm';

interface HealthComponent {
  status: 'ok' | 'down' | 'timeout';
  latencyMs: number;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  components: {
    database: HealthComponent;
  };
}

export async function runHealthChecks(): Promise<HealthResponse> {
  const start = Date.now();
  let dbStatus: HealthComponent = { status: 'ok', latencyMs: 0 };

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    dbStatus.latencyMs = Date.now() - start;
  } catch {
    dbStatus = { status: 'down', latencyMs: Date.now() - start };
  }

  const allOk = dbStatus.status === 'ok';
  const anyOk = dbStatus.status === 'ok';

  return {
    status: allOk ? 'ok' : anyOk ? 'degraded' : 'down',
    timestamp: new Date().toISOString(),
    components: { database: dbStatus },
  };
}

export async function checkMigrationsCurrent(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`SELECT COUNT(*) as c FROM drizzle_migrations`);
    return true;
  } catch {
    return false;
  }
}
