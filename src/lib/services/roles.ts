import { getDb } from '../../database/client';
import { userRoles } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

const AUTO_ASSIGNABLE_ROLES = ['provider'];
const ALL_ROLES = ['user', 'provider', 'admin'] as const;

export type Role = (typeof ALL_ROLES)[number];

export async function getUserRoles(locals: any, userId: number): Promise<Role[]> {
  const db = getDb();
  const roles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .all();
  return roles.map((r) => r.role as Role);
}

export async function addRoleToUser(locals: any, userId: number, role: Role, grantedBy?: number): Promise<void> {
  if (!AUTO_ASSIGNABLE_ROLES.includes(role)) throw new Error(`rol ${role} no es auto-asignable`);
  const db = getDb();
  await db
    .insert(userRoles)
    .values({ userId, role, grantedBy, grantedAt: new Date() })
    .onConflictDoNothing()
    .run();
}

export function hasAnyRole(userRolesSet: Role[], required: Role | Role[]): boolean {
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.some((r) => userRolesSet.includes(r));
}
