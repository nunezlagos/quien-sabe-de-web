import { getDb } from '../../database/client';
import { userRoles } from '../../database/schema';
import { eq } from 'drizzle-orm';

type Role = 'user' | 'provider' | 'admin';

export async function requireRole(locals: any, roleOrRoles: Role | Role[]): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const user = locals.user;
  if (!user) {
    return { ok: false, status: 401, error: 'no autenticado' };
  }

  const required = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

  const db = getDb(locals);
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id))
    .all();
  const userRolesSet = rows.map((r) => r.role as Role);

  const active = user.activeRole || user.role;
  const effectiveRoles = [active, ...userRolesSet];

  const hasMatch = required.some((r) => effectiveRoles.includes(r));
  if (!hasMatch) {
    return { ok: false, status: 403, error: `requiere rol: ${required.join(' o ')}` };
  }

  console.debug(`[auth] user=${user.id} roles=[${effectiveRoles.join(',')}] active=${active} required=${required.join(',')}`);
  return { ok: true };
}
