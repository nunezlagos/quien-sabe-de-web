import { getDb } from '../../../database/client';
import { tickets, ticketMessages, users } from '../../../database/schema';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { sendMail, buildTicketNotificationEmail } from '../../services/email/mailpit';

export async function createTicket(locals: any, input: { kind: string; subject: string; body: string; contactEmail?: string; targetProviderId?: number }): Promise<typeof tickets.$inferSelect> {
  const db = getDb();
  const user = (locals as any).user || null;

  const ticket = await db.insert(tickets).values({
    kind: input.kind as any,
    subject: input.subject,
    contactEmail: input.contactEmail || null,
    targetProviderId: input.targetProviderId || null,
    createdByUserId: user?.id || null,
    status: 'abierto',
  }).returning().get();

  await db.insert(ticketMessages).values({
    ticketId: ticket.id,
    sender: 'author',
    body: input.body,
    internalNote: false,
  }).run();

  if (user && input.targetProviderId) {
    const openCount = await db.select({ c: count() }).from(tickets)
      .where(and(
        eq(tickets.createdByUserId, user.id),
        eq(tickets.targetProviderId, input.targetProviderId),
        sql`${tickets.status} != 'cerrado'`
      )).get();
    if (openCount && openCount.c > 0) {
      await db.insert(ticketMessages).values({
        ticketId: ticket.id,
        sender: 'system',
        body: `[system] El usuario ya tiene ${openCount.c} ticket(s) abierto(s) contra este prestador.`,
        internalNote: true,
      }).run();
    }
  }

  return ticket;
}

export async function getTicketById(locals: any, ticketId: number): Promise<typeof tickets.$inferSelect | null> {
  const db = getDb();
  const result = await db.select().from(tickets).where(eq(tickets.id, ticketId)).get();
  return result ?? null;
}

export async function listTicketsForAdmin(locals: any, filters: { status?: string; kind?: string; assignee?: string; limit?: number; cursor?: number }): Promise<{ items: any[]; cursor: number | null }> {
  const db = getDb();
  const conditions = [];
  if (filters.status) conditions.push(eq(tickets.status, filters.status as any));
  if (filters.kind) conditions.push(eq(tickets.kind, filters.kind as any));
  if (filters.assignee === 'me') conditions.push(sql`${tickets.assigneeAdminId} IS NOT NULL`);

  const limit = filters.limit || 20;
  const items = await db.select().from(tickets)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tickets.createdAt))
    .limit(limit + 1)
    .all();

  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;
  return { items: result, cursor: hasMore ? result[result.length - 1].id : null };
}

export async function transitionTicket(locals: any, ticketId: number, status: string, assigneeAdminId?: number): Promise<typeof tickets.$inferSelect> {
  const db = getDb();
  const updates: any = { status };
  if (assigneeAdminId) updates.assigneeAdminId = assigneeAdminId;
  await db.update(tickets).set(updates).where(eq(tickets.id, ticketId)).run();

  if (status === 'en_revision' || status === 'cerrado') {
    await db.insert(ticketMessages).values({
      ticketId,
      sender: 'system',
      body: `[system] Ticket ${status === 'en_revision' ? 'en revisión' : 'cerrado'}`,
      internalNote: true,
    }).run();
  }

  const ticket = await getTicketById(locals, ticketId);

  if (ticket && (status === 'en_revision' || status === 'cerrado')) {
    const recipient = ticket.contactEmail || (ticket.createdByUserId
      ? (await db.select({ email: users.email }).from(users).where(eq(users.id, ticket.createdByUserId)).get())?.email
      : null);
    if (recipient) {
      const statusText = status === 'en_revision' ? 'está en revisión' : 'ha sido cerrado';
      sendMail(buildTicketNotificationEmail(recipient, ticketId, ticket.subject, statusText));
    }
  }

  return ticket!;
}

export async function addMessage(locals: any, ticketId: number, sender: string, body: string, internalNote: boolean = false): Promise<typeof ticketMessages.$inferSelect> {
  const db = getDb();
  return db.insert(ticketMessages).values({ ticketId, sender: sender as any, body, internalNote }).returning().get();
}

export async function listMessages(locals: any, ticketId: number, isAdmin: boolean): Promise<any[]> {
  const db = getDb();
  const conditions: any[] = [eq(ticketMessages.ticketId, ticketId)];
  if (!isAdmin) conditions.push(eq(ticketMessages.internalNote, false));
  return db.select().from(ticketMessages).where(and(...conditions)).orderBy(ticketMessages.createdAt).all();
}
