import type { APIContext } from 'astro';
import { createInMemoryDb, createD1LikeBinding, createInMemoryKV, FakeCookies, type KVLike } from './in-memory-db';

let dbSingleton: ReturnType<typeof createInMemoryDb> | null = null;

function getOrCreateDb() {
	if (!dbSingleton) dbSingleton = createInMemoryDb();
	return dbSingleton;
}

export function resetContextoAuth() {
	dbSingleton = null;
}

export interface ContextoAuth {
	contexto: APIContext;
	kv: KVLike;
	db: ReturnType<typeof createInMemoryDb>;
	cookies: FakeCookies;
}

export function crearContextoAuth(opciones?: {
	body?: unknown;
	url?: string;
	db?: ReturnType<typeof createInMemoryDb>;
	kv?: KVLike;
}): ContextoAuth {
	const db = opciones?.db ?? getOrCreateDb();
	const kv = opciones?.kv ?? createInMemoryKV();
	const cookies = opciones?.cookies ?? new FakeCookies();

	const url = opciones?.url ? new URL(opciones.url) : new URL('http://localhost/');

	const init: RequestInit = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	};
	if (opciones?.body !== undefined) {
		init.body = JSON.stringify(opciones.body);
	}
	const request = new Request(url.toString(), init);

	const contexto = {
		request,
		url,
		cookies: cookies as unknown as APIContext['cookies'],
		redirect: (path: string) =>
			new Response(null, { status: 302, headers: { Location: path } }),
		params: {},
		props: {},
		site: undefined,
		generator: '',
		clientAddress: '127.0.0.1',
		preferredLocale: undefined,
		preferredLocaleList: undefined,
		currentLocale: undefined,
		locals: {
			runtime: {
				env: {
					DB: createD1LikeBinding(db.$client) as unknown as KVNamespace,
					SESSION: kv as unknown as KVNamespace,
					SESSION_TTL_SECONDS: '2592000',
					PUBLIC_SITE_URL: 'http://localhost:4323',
				},
				ctx: {},
			},
			user: undefined,
		},
	} as unknown as APIContext;

	return { contexto, kv, db, cookies };
}