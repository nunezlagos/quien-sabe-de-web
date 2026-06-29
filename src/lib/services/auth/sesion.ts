import type { Usuario } from '../../../database/schema';
import { generarToken, bytesABase64, base64ABytes } from '../../utils/crypto';

const PREFIJO_CLAVE = 'sesion:';

export interface SesionKV {
  token: string;
  ttlSegundos: number;
}

function getSecret(): string {
  return process.env.SESSION_SECRET || 'dev-secret-change-in-prod';
}

function getTtl(): number {
  const raw = process.env.SESSION_TTL_SECONDS;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 60 * 60 * 24 * 30;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bytesABase64(new Uint8Array(sig));
}

function encodeB64(data: string): string {
  return bytesABase64(new TextEncoder().encode(data));
}

function decodeB64(b64: string): string {
  return new TextDecoder().decode(base64ABytes(b64));
}

export async function crearSesion(
  usuario: Pick<Usuario, 'id' | 'role' | 'status'>,
): Promise<SesionKV> {
  const ttlSegundos = getTtl();
  const exp = Math.floor(Date.now() / 1000) + ttlSegundos;
  const payload = JSON.stringify({
    userId: usuario.id,
    role: usuario.role,
    status: usuario.status,
    exp,
  });
  const b64Payload = encodeB64(payload);
  const sig = await hmacSign(b64Payload, getSecret());
  const token = `${b64Payload}.${sig}`;
  return { token, ttlSegundos };
}

export async function destruirSesion(
  _token: string,
): Promise<void> {
  // Stateless cookie - nothing to destroy server-side
}

export interface CargaSesion {
  userId: number;
  role: 'user' | 'provider' | 'admin';
  status: 'active' | 'banned';
  exp: number;
}

export async function leerSesion(
  token: string,
): Promise<CargaSesion | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, sig] = parts;

    const expectedSig = await hmacSign(b64Payload!, getSecret());
    if (sig !== expectedSig) return null;

    const payload = decodeB64(b64Payload!);
    const parsed = JSON.parse(payload) as CargaSesion;

    if (
      typeof parsed?.userId !== 'number' ||
      typeof parsed?.exp !== 'number' ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
