import type { APIRoute } from 'astro';
import { listTicketsForAdmin } from '../../../../../lib/services/tickets';
import { errorResponse, jsonResponse } from '../../../../../lib/utils/response';

export const GET: APIRoute = async ({ locals, url }) => {
  const user = (locals as any).user;
  if (!user || user.role !== 'admin') return errorResponse('No autorizado', 403);

  const tickets = await listTicketsForAdmin(locals, {
    status: url.searchParams.get('status') || undefined,
    kind: url.searchParams.get('kind') || undefined,
    assignee: url.searchParams.get('assignee') || undefined,
    limit: Number(url.searchParams.get('limit')) || 50,
    cursor: Number(url.searchParams.get('cursor')) || undefined,
  });

  return jsonResponse(tickets);
};
