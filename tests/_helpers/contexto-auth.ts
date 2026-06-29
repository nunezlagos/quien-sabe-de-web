import type { APIContext } from 'astro';
import { FakeCookies } from './in-memory-db';

export interface ContextoAuth {
  contexto: APIContext;
  cookies: FakeCookies;
}

export function crearContextoAuth(opciones?: {
  body?: unknown;
  url?: string;
  cookies?: FakeCookies;
}): ContextoAuth {
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
      user: undefined,
    },
  } as unknown as APIContext;

  return { contexto, cookies };
}

export function resetContextoAuth() {}
