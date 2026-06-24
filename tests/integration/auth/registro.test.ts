import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registro } from '../../../src/pages/api/v1/auth/registro';
import { POST as inicioSesion } from '../../../src/pages/api/v1/auth/iniciar-sesion';
import { POST as cerrarSesion } from '../../../src/pages/api/v1/auth/cerrar-sesion';
import { GET as yo } from '../../../src/pages/api/v1/auth/yo';
import { crearContextoAuth, resetContextoAuth } from '../../_helpers/contexto-auth';
import { buscarUsuarioPorCorreo } from '../../../src/lib/services/auth/usuarios';

describe('POST /api/v1/auth/registro', () => {
	beforeEach(() => {
		resetContextoAuth();
	});
	it('registra usuario nuevo, hashea contraseña y emite cookie', async () => {
		const { contexto, cookies, db } = crearContextoAuth({
			body: { nombre: 'Ana Pérez', correo: 'ana@ejemplo.cl', contrasena: 'Secreta123!' },
		});
		const response = await registro(contexto);
		expect(response.status).toBe(201);

		const json = await response.json();
		expect(json.usuario).toMatchObject({
			nombre: 'Ana Pérez',
			correo: 'ana@ejemplo.cl',
			rol: 'user',
		});
		expect(json.usuario).not.toHaveProperty('passwordHash');
		expect(cookies.get('sesion')?.value).toBeTruthy();

		const stored = await buscarUsuarioPorCorreo({ locals: contexto.locals }, 'ana@ejemplo.cl');
		expect(stored).toBeTruthy();
		expect(stored!.passwordHash.startsWith('pbkdf2$')).toBe(true);
	});

	it('rechaza email duplicado con 409', async () => {
		const a = crearContextoAuth({ body: { nombre: 'Ana', correo: 'duplicado@x.cl', contrasena: 'Secreta123!' } });
		await registro(a.contexto);

		const b = crearContextoAuth({ body: { nombre: 'Otro', correo: 'duplicado@x.cl', contrasena: 'Secreta123!' } });
		const r = await registro(b.contexto);
		expect(r.status).toBe(409);
		const json = await r.json();
		expect(json.error).toBe('correo ya registrado');
	});

	it('rechaza contraseña débil con 400', async () => {
		const { contexto } = crearContextoAuth({
			body: { nombre: 'Ana', correo: 'ana@x.cl', contrasena: 'abc' },
		});
		const r = await registro(contexto);
		expect(r.status).toBe(400);
	});

	it('rechaza email mal formado con 400', async () => {
		const { contexto } = crearContextoAuth({
			body: { nombre: 'Ana', correo: 'no-email', contrasena: 'Secreta123!' },
		});
		const r = await registro(contexto);
		expect(r.status).toBe(400);
	});
});

describe('POST /api/v1/auth/iniciar-sesion', () => {
	async function registrarUsuario(correo: string, contrasena: string) {
		const { contexto } = crearContextoAuth({ body: { nombre: 'Ana', correo, contrasena } });
		await registro(contexto);
	}

	it('login exitoso devuelve 200, cookie y usuario', async () => {
		await registrarUsuario('ana@x.cl', 'Secreta123!');

		const { contexto, cookies } = crearContextoAuth({
			body: { correo: 'ana@x.cl', contrasena: 'Secreta123!' },
		});
		const r = await inicioSesion(contexto);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json.usuario.correo).toBe('ana@x.cl');
		expect(cookies.get('sesion')?.value).toBeTruthy();
	});

	it('contraseña incorrecta devuelve 401 con mensaje único', async () => {
		await registrarUsuario('ana@x.cl', 'Secreta123!');

		const { contexto } = crearContextoAuth({
			body: { correo: 'ana@x.cl', contrasena: 'Equivocada!' },
		});
		const r = await inicioSesion(contexto);
		expect(r.status).toBe(401);
		const json = await r.json();
		expect(json.error).toBe('credenciales inválidas');
	});

	it('correo inexistente devuelve MISMO mensaje que contraseña incorrecta (anti-enumeración)', async () => {
		const { contexto } = crearContextoAuth({
			body: { correo: 'fantasma@x.cl', contrasena: 'Secreta123!' },
		});
		const r = await inicioSesion(contexto);
		expect(r.status).toBe(401);
		const json = await r.json();
		expect(json.error).toBe('credenciales inválidas');
	});

	it('email es case-insensitive en login', async () => {
		await registrarUsuario('mixto@x.cl', 'Secreta123!');
		const { contexto } = crearContextoAuth({
			body: { correo: 'MIXTO@x.cl', contrasena: 'Secreta123!' },
		});
		const r = await inicioSesion(contexto);
		expect(r.status).toBe(200);
	});
});

describe('POST /api/v1/auth/cerrar-sesion', () => {
	it('destruye sesión y limpia cookie', async () => {
		const a = crearContextoAuth({ body: { nombre: 'Ana', correo: 'ana@x.cl', contrasena: 'Secreta123!' } });
		await registro(a.contexto);
		const tokenInicial = a.cookies.get('sesion')?.value;
		expect(tokenInicial).toBeTruthy();

		const b = crearContextoAuth();
		b.cookies.set('sesion', tokenInicial!);

		const r = await cerrarSesion(b.contexto);
		expect(r.status).toBe(200);

		const stored = await b.kv.get(`sesion:${tokenInicial}`);
		expect(stored).toBeNull();
	});

	it('cerrar sesión sin cookie activa responde 200 idempotente', async () => {
		const { contexto } = crearContextoAuth();
		const r = await cerrarSesion(contexto);
		expect(r.status).toBe(200);
	});
});

describe('GET /api/v1/auth/yo', () => {
	it('devuelve 401 si no hay locals.user', async () => {
		const { contexto } = crearContextoAuth();
		contexto.locals.user = undefined;
		const r = await yo(contexto);
		expect(r.status).toBe(401);
	});

	it('devuelve usuario si locals.user está hidratado', async () => {
		const { contexto } = crearContextoAuth();
		contexto.locals.user = {
			id: 42,
			email: 'ana@x.cl',
			name: 'Ana',
			role: 'user',
			status: 'active',
		};
		const r = await yo(contexto);
		expect(r.status).toBe(200);
		const json = await r.json();
		expect(json.usuario.correo).toBe('ana@x.cl');
	});
});