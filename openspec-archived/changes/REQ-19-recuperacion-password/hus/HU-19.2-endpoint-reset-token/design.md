# Diseno tecnico — HU-19.2 — Validar token de reset vigente

**REQ padre:** REQ-19-recuperacion-password

## Modelo de datos

No se introducen tablas. La fuente de verdad es la key KV
`pwreset:<token>` creada en HU-19.1. El value es JSON
`{ user_id, created_at }` con TTL 1800s gestionado por KV.

## Contrato de API

### `GET /api/v1/auth/reset/:token`

Auth: público.

Response 200 (válido):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user_email_masked": "ve***@example.com"
  }
}
```

Response 410 (inválido o expirado):
```json
{
  "success": false,
  "error": "token inválido o expirado"
}
```

## Validaciones Zod

No se valida Zod en request; `:token` es un path param con regex `/^[a-f0-9]{64}$/`. Si no matchea, 410 inmediato.

## Componentes UI

- `src/lib/utils/mask.ts`:
  ```ts
  export function maskEmail(email: string): string {
    // 'vecino@example.com' -> 've***@example.com'
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }
  ```

- `src/pages/reset/[token].astro` con `export const prerender = false`:
  ```astro
  ---
  import { getResetTokenStatus } from '../../lib/services/auth/reset-token';
  const { token } = Astro.params;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return Astro.redirect('/forgot-password');
  }
  const status = await getResetTokenStatus(Astro.locals.runtime.env.SESSION, token);
  if (!status.valid) {
    // render error card
  }
  ---
  ```

- Estilo de error: card `bg-white rounded-3xl shadow-sm border border-gray-100` centrado, ícono rojo `ri-error-warning-line`, título "Este enlace expiró", texto "El enlace de recuperación ya no es válido", botón `bg-primary rounded-xl` "Solicitar nuevo enlace" que linkea a `/forgot-password`. Sigue el patrón de `mockups/profile.html` (estado de error `#profile-error`).

## Flujo de interaccion (secuencial)

1. Usuario hace click en el link del email → navegador navega a `/reset/<token>`.
2. SSR ejecuta `getResetTokenStatus(kv, token)`.
3. Si `status.valid`: lee `users.email` por `user_id`, aplica `maskEmail`, renderiza form (HU-19.3).
4. Si no: renderiza card de error.
5. (Alternativa) Usuario entra directo a `/api/v1/auth/reset/<token>` y recibe JSON 200/410.

## Capa de servicios

```ts
// src/lib/services/auth/reset-token.ts (ampliar HU-19.1)
export type ResetTokenStatus =
  | { valid: true; userId: number; createdAt: number }
  | { valid: false; reason: 'not_found' | 'expired' };

export async function getResetTokenStatus(kv: KVNamespace, token: string): Promise<ResetTokenStatus>;

// src/lib/utils/mask.ts
export function maskEmail(email: string): string;
```

`getResetTokenStatus`:
1. `const raw = await kv.get<{ user_id: number; created_at: number }>(`pwreset:${token}`, 'json');`
2. Si null → `{ valid:false, reason:'not_found' }`.
3. Si existe pero `Date.now() - created_at > 1800_000` → `{ valid:false, reason:'expired' }`.
4. Else → `{ valid:true, userId, createdAt }`.

(La verificación de `created_at` es redundante con TTL de KV, pero defensa contra clocks skew.)

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/mask.test.ts` | `maskEmail("vecino@example.com")` → `"ve***@example.com"`; local de 1 char → `"v***@..."`; sin `@` → throw |
| Unit | `tests/unit/auth/reset-token-status.test.ts` | `getResetTokenStatus` con KV mock: null → not_found; created_at viejo → expired; reciente → valid |
| Integracion | `tests/integration/auth/reset-token-validate.test.ts` | endpoint con token válido (KV sembrado) → 200 con masked email; token inexistente → 410; token expirado (created_at > 30 min) → 410; token con formato inválido (no hex 64) → 410 |

## Dependencias y secuencia

- **Bloqueado por:** HU-19.1 (creación del token en KV).
- **Bloquea a:** HU-19.3 (form de nuevo password consume esta validación implícitamente al mostrar el form).
- **Recursos compartidos:** `Astro.locals.runtime.env.SESSION`.

## Riesgos tecnicos

- Riesgo: el endpoint puede ser llamado miles de veces por enumeración → Mitigación: KV es barato y rápido, pero considerar rate-limit 60/h por IP en HU aparte; fuera de scope aquí.
- Riesgo: la regex del path param no acepta tokens legacy (si en el futuro se migra a base62) → Mitigación: documentar el contrato; cambiar regex es trivial cuando se decida.
- Riesgo: SSR fetch a endpoint introduce latencia → Mitigación: la vista NO hace fetch HTTP; lee KV directo vía `getResetTokenStatus`. El endpoint es para integraciones externas.
