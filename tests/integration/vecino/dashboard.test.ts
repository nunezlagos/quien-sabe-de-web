import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { GET as getContacts } from '../../../src/pages/api/v1/users/me/contacts/index';
import { GET as getReviews } from '../../../src/pages/api/v1/users/me/reviews/index';
import { GET as getProfile, PATCH as patchProfile, POST as postOnboarding } from '../../../src/pages/api/v1/users/me/profile/index';
import { GET as getViews } from '../../../src/pages/api/v1/users/me/views/index';
import { POST as postView } from '../../../src/pages/api/v1/providers/[id]/views/index';
import { crearContextoAuth } from '../../_helpers/contexto-auth';
import { getDb } from '../../../src/database/client';
import { resetTestDb } from '../../_helpers/test-db';
import { seedCommunes } from '../../../src/lib/services/communes';
import { users, trades, contactEvents, reviews, userViews } from '../../../src/database/schema';

type Db = ReturnType<typeof getDb>;

beforeEach(async () => {
	await resetTestDb();
});

async function createDb() {
	const db = getDb();
	await seedCommunes(db, [{ name: 'Santiago', region: 'Metropolitana' }]);

	await db.insert(users).values([
		{ email: 'vecino@x.cl', name: 'Vecino Test', role: 'user', status: 'active', passwordHash: '', createdAt: new Date() },
		{ email: 'prestador@x.cl', name: 'Prestador Test', role: 'provider', status: 'active', passwordHash: '', createdAt: new Date() },
	]).run();

	const vecinoId = 1;
	const prestadorId = 2;

	await db.insert(trades).values([
		{ id: 1, userId: prestadorId, name: 'Gasfiter', symbol: 'GAS', slug: 'gasfiter', category: 'hogar', basePriceClp: 25000, communeId: 1, createdAt: new Date() },
		{ id: 2, userId: prestadorId, name: 'Electricista', symbol: 'ELE', slug: 'electricista', category: 'hogar', basePriceClp: 30000, communeId: 1, createdAt: new Date() },
	]).run();

	return { db, vecinoId, prestadorId, communeId: 1 };
}

async function seedData(db: Db, vecinoId: number, tradeIds: number[]) {
	const now = new Date();

	await db.insert(contactEvents).values([
		{ tradeId: tradeIds[0], userId: vecinoId, visitorId: null, eventType: 'whatsapp', createdAt: now },
		{ tradeId: tradeIds[1], userId: vecinoId, visitorId: null, eventType: 'phone', createdAt: now },
	]).run();

	await db.insert(reviews).values([
		{ tradeId: tradeIds[0], userId: vecinoId, reviewerName: 'Vecino Test', rating: 5, body: 'Excelente servicio', createdAt: now },
		{ tradeId: tradeIds[1], userId: vecinoId, reviewerName: 'Vecino Test', rating: 4, body: 'Buen trabajo', createdAt: now },
	]).run();

	await db.insert(userViews).values([
		{ userId: vecinoId, tradeId: tradeIds[0], createdAt: now },
		{ userId: vecinoId, tradeId: tradeIds[1], createdAt: now },
	]).run();
}

function crearContextoVecino(opciones?: { body?: unknown; url?: string; params?: Record<string, string> }) {
	const result = crearContextoAuth({ body: opciones?.body, url: opciones?.url });
	result.contexto.locals.user = { id: 1, email: 'vecino@x.cl', name: 'Vecino Test', role: 'user', status: 'active' };
	if (opciones?.params) {
		result.contexto.params = opciones.params as any;
	}
	return result;
}

describe('GET /api/v1/users/me/contacts', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await getContacts({ ...contexto, locals: { ...contexto.locals, user: undefined } } as any);
		expect(r.status).toBe(401);
	});

	it('devuelve lista de contactos del vecino', async () => {
		const { db, vecinoId } = await createDb();
		await seedData(db, vecinoId, [1, 2]);
		const { contexto } = crearContextoVecino();

		const r = await getContacts(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toHaveLength(2);
		expect(json[0]).toHaveProperty('eventType');
		expect(json[0]).toHaveProperty('tradeName');
	});

	it('devuelve arreglo vacío si no hay contactos', async () => {
		await createDb();
		const { contexto } = crearContextoVecino();

		const r = await getContacts(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toEqual([]);
	});
});

describe('GET /api/v1/users/me/reviews', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await getReviews({ ...contexto, locals: { ...contexto.locals, user: undefined } } as any);
		expect(r.status).toBe(401);
	});

	it('devuelve reseñas del vecino', async () => {
		const { db, vecinoId } = await createDb();
		await seedData(db, vecinoId, [1, 2]);
		const { contexto } = crearContextoVecino();

		const r = await getReviews(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toHaveLength(2);
		expect(json[0]).toHaveProperty('rating');
		expect(json[0]).toHaveProperty('body');
		expect(json[0]).toHaveProperty('tradeName');
	});

	it('devuelve arreglo vacío si no hay reseñas', async () => {
		await createDb();
		const { contexto } = crearContextoVecino();

		const r = await getReviews(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toEqual([]);
	});
});

describe('GET /api/v1/users/me/profile', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await getProfile({ ...contexto, locals: { ...contexto.locals, user: undefined } } as any);
		expect(r.status).toBe(401);
	});

	it('devuelve perfil del vecino', async () => {
		const { db } = await createDb();
		await db.update(users).set({ communeId: 1, interests: 'plomeria, electricidad' }).where(eq(users.id, 1)).run();
		const { contexto } = crearContextoVecino();

		const r = await getProfile(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toHaveProperty('id', 1);
		expect(json).toHaveProperty('name', 'Vecino Test');
		expect(json).toHaveProperty('email', 'vecino@x.cl');
		expect(json).toHaveProperty('communeName', 'Santiago');
		expect(json).toHaveProperty('interests', 'plomeria, electricidad');
	});
});

describe('PATCH /api/v1/users/me/profile', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await patchProfile({ ...contexto, locals: { ...contexto.locals, user: undefined } } as any);
		expect(r.status).toBe(401);
	});

	it('actualiza nombre y intereses', async () => {
		const { db } = await createDb();
		const { contexto } = crearContextoVecino({ body: { name: 'Vecino Actualizado', interests: 'carpinteria' } });

		const r = await patchProfile(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toEqual({ ok: true });

		const updated = await db.select().from(users).where(eq(users.id, 1)).get();
		expect(updated?.name).toBe('Vecino Actualizado');
		expect(updated?.interests).toBe('carpinteria');
	});

	it('rechaza body inválido con 422', async () => {
		await createDb();
		const { contexto } = crearContextoVecino({ body: { name: '' } });

		const r = await patchProfile(contexto as any);
		expect(r.status).toBe(422);
	});
});

describe('POST /api/v1/users/me/profile (onboarding)', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await postOnboarding({ ...contexto, locals: { ...contexto.locals, user: undefined } } as any);
		expect(r.status).toBe(401);
	});

	it('completa onboarding con datos válidos', async () => {
		const { db } = await createDb();
		const { contexto } = crearContextoVecino({ body: { communeId: 1, acceptedTerms: true, interests: 'plomeria' } });

		const r = await postOnboarding(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toEqual({ ok: true });

		const updated = await db.select().from(users).where(eq(users.id, 1)).get();
		expect(updated?.communeId).toBe(1);
		expect(updated?.acceptedTermsAt).toBeTruthy();
		expect(updated?.onboardedAt).toBeTruthy();
	});

	it('rechaza si acceptedTerms no es true', async () => {
		await createDb();
		const { contexto } = crearContextoVecino({ body: { communeId: 1, acceptedTerms: false } });

		const r = await postOnboarding(contexto as any);
		expect(r.status).toBe(422);
	});

	it('rechaza si role no es user', async () => {
		await createDb();
		const { contexto } = crearContextoVecino({ body: { communeId: 1, acceptedTerms: true } });
		contexto.locals.user = { ...contexto.locals.user!, role: 'provider' };

		const r = await postOnboarding(contexto as any);
		expect(r.status).toBe(403);
	});
});

describe('GET /api/v1/users/me/views', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await getViews({ ...contexto, locals: { ...contexto.locals, user: undefined } } as any);
		expect(r.status).toBe(401);
	});

	it('devuelve vistas recientes del vecino', async () => {
		const { db, vecinoId } = await createDb();
		await seedData(db, vecinoId, [1, 2]);
		const { contexto } = crearContextoVecino();

		const r = await getViews(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toHaveLength(2);
		expect(json[0]).toHaveProperty('tradeName');
		expect(json[0]).toHaveProperty('tradeSlug');
	});

	it('devuelve arreglo vacío si no hay vistas', async () => {
		await createDb();
		const { contexto } = crearContextoVecino();

		const r = await getViews(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toEqual([]);
	});
});

describe('POST /api/v1/providers/[id]/views', () => {
	it('devuelve 401 si no hay sesión', async () => {
		const { contexto } = crearContextoAuth();
		const r = await postView({ ...contexto, locals: { ...contexto.locals, user: undefined }, params: { id: '1' } } as any);
		expect(r.status).toBe(401);
	});

	it('registra vista a un oficio', async () => {
		const { db } = await createDb();
		const { contexto } = crearContextoVecino({ params: { id: '1' } });

		const r = await postView(contexto as any);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json).toEqual({ ok: true });

		const views = await db.select().from(userViews).where(eq(userViews.userId, 1)).all();
		expect(views).toHaveLength(1);
		expect(views[0].tradeId).toBe(1);
	});

	it('actualiza createdAt si ya existe vista', async () => {
		const { db, vecinoId } = await createDb();
		const oldDate = new Date(2020, 1, 1);
		await db.insert(userViews).values({ userId: vecinoId, tradeId: 1, createdAt: oldDate }).run();
		const { contexto } = crearContextoVecino({ params: { id: '1' } });

		const r = await postView(contexto as any);
		expect(r.status).toBe(200);

		const views = await db.select().from(userViews).where(eq(userViews.userId, 1)).all();
		expect(views).toHaveLength(1);
	});

	it('devuelve 404 si oficio no existe', async () => {
		await createDb();
		const { contexto } = crearContextoVecino({ params: { id: '999' } });

		const r = await postView(contexto as any);
		expect(r.status).toBe(404);
	});

	it('devuelve 400 si ID no es numérico', async () => {
		await createDb();
		const { contexto } = crearContextoVecino({ params: { id: 'abc' } });

		const r = await postView(contexto as any);
		expect(r.status).toBe(400);
	});
});
