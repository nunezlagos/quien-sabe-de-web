import { getDb } from '../../../database/client';
import { donations } from '../../../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sendMail } from '../../services/email/mailpit';

export async function createDonation(locals: any, input: { provider: string; amountClp: number; recurring: boolean; payerEmail?: string; userId?: number; externalId?: string }) {
  const db = getDb();
  return db.insert(donations).values({
    provider: input.provider as any,
    amountClp: input.amountClp,
    recurring: input.recurring,
    payerEmail: input.payerEmail || null,
    userId: input.userId || null,
    externalId: input.externalId || null,
    status: 'pending',
  }).returning().get();
}

export async function updateDonationStatus(locals: any, externalId: string, status: string, provider: string) {
  const db = getDb();
  const donation = await db.select().from(donations)
    .where(and(
      eq(donations.externalId, externalId),
      eq(donations.provider, provider as any)
    ))
    .get();
  if (!donation) return null;
  await db.update(donations).set({ status: status as any, updatedAt: new Date() })
    .where(eq(donations.id, donation.id)).run();
  if (status === 'approved' && donation.payerEmail) {
    sendMail({
      to: donation.payerEmail,
      subject: `Donación #${donation.id} recibida — QuiénSabe`,
      text: `Gracias por tu donación de $${donation.amountClp.toLocaleString('es-CL')} a QuiénSabe.`,
      html: `<p>Gracias por tu donación de <b>$${donation.amountClp.toLocaleString('es-CL')}</b> a QuiénSabe.</p><p>Tu apoyo mantiene la plataforma funcionando para la comunidad.</p>`,
    });
  }
  return donation;
}

export async function getUserDonations(locals: any, userId: number) {
  const db = getDb();
  return db.select().from(donations)
    .where(eq(donations.userId, userId))
    .orderBy(desc(donations.createdAt))
    .all();
}
