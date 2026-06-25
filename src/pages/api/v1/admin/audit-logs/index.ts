import type { APIRoute } from 'astro';
import { getDb } from '../../../../database/client';
import { adminAuditLog, users } from '../../../../database/schema';
import { desc, eq } from 'drizzle-orm';
import { errorResponse, jsonResponse } from '../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals }) => {
  const u = (locals as any).user;
  if (!u || u.role !== 'admin') return errorResponse('No autorizado', 401);

  const db = getDb(locals);
  const logs = await db.select({
    id: adminAuditLog.id,
    action: adminAuditLog.action,
    entityType: adminAuditLog.entityType,
    entityId: adminAuditLog.entityId,
    details: adminAuditLog.details,
    createdAt: adminAuditLog.createdAt,
    adminName: users.name,
  })
    .from(adminAuditLog)
    .leftJoin(users, eq(users.id, adminAuditLog.adminId))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(100)
    .all();

  return jsonResponse(logs);
};
