# Diseno tecnico — HU-19.1 — Solicitar reset de contraseña por email

**REQ padre:** REQ-19-recuperacion-password

## Modelo de datos

No se introducen tablas D1. El storage del token es KV `SESSION`:

- Key: `pwreset:<token>` (token = 32 bytes hex = 64 chars).
- Value: JSON `{ user_id: number, created_at: number }`.
- TTL: 1800s (30 min).

`email_log` (de REQ-17) registra el envío.

## Contrato de API

### `POST /api/v1/auth/forgot-password`

Auth: público.

Request:
```json
{ "email": "vecino@example.com" }
```

Response 202 (siempre que pase validación):
```json
{ "success": true, "data": { "sent": true } }
```

Response 400 (Zod): `{ success:false, error:"email inválido" }`
Response 429: `{ success:false, error:"demasiadas solicitudes" }`

## Validaciones Zod

```ts
// src/lib/validators/auth.ts
export const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});
```

## Componentes UI

- `src/pages/forgot-password.astro` — replica el patrón de
  `mockups/forgot-password.html:28-68`: card blanca `bg-white rounded-3xl
  shadow-sm border border-gray-100`, input email, botón `bg-primary
  rounded-xl` "Enviar enlace de recuperación". Tras submit (POST fetch al
  endpoint), oculta el form y muestra `#success-card` con el mensaje neutro
  "Si el email existe, recibirás instrucciones". El mensaje es idéntico
  exista o no el email (anti-enumeración).

- `src/components/auth/ForgotPasswordForm.astro` — form controlado con
  `<script>` que hace `fetch('/api/v1/auth/forgot-password', { method:'POST', body: JSON.stringify({email}) })` y alterna cards.

## Flujo de interaccion (secuencial)

1. Visitante abre `/forgot-password`.
2. Completa email y hace submit.
3. Cliente POST al endpoint.
4. Endpoint:
  1. Valida Zod.
  2. Check rate-limit (email 3/h, IP 5/h) → 429 si excede.
  3. Si pasa: `db.select().from(users).where(eq(email, input.email))`.
  4. Si existe: `generateResetToken()`; `kv.put('pwreset:<token>', { user_id }, { expirationTtl: 1800 })`.
  5. `emailService.send({ template:'password_reset', to, vars:{...}, relatedEntity: 'user:'+user_id })` (fire-and-forget).
  6. Retorna 202.
  5. Si NO existe: skip storage y email; retorna 202 idéntico.
6. Cliente muestra success card.

## Capa de servicios

```ts
// src/lib/services/auth/reset-token.ts
export function generateResetToken(): string;   // 32 bytes hex (CSPRNG via crypto.getRandomValues)

// src/lib/services/auth/forgot-password.ts
export async function requestPasswordReset(
  deps: { db: Db; kv: KVNamespace; emailService: EmailService; ip: string },
  input: { email: string },
): Promise<void>;

// src/lib/middleware/rate-limit.ts
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,        // ej: 'rl:fp:email:<hash>' o 'rl:fp:ip:<addr>'
  limit: number,      // ej: 3
  windowSec: number,  // ej: 3600
): Promise<{ allowed: boolean; remaining: number }>;
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/reset-token.test.ts` | `generateResetToken` retorna 64 chars hex; 1000 tokens son todos distintos (CSPRNG) |
| Unit | `tests/unit/validators/auth.test.ts` | `forgotPasswordSchema` acepta email válido, rechaza sin `@`, rechaza > 254 |
| Unit | `tests/unit/middleware/rate-limit.test.ts` | `checkRateLimit` con KV mock: 3 hits OK, 4to 429; reset tras ventana |
| Integracion | `tests/integration/auth/forgot-password.test.ts` | email existente → KV put + email send + log; email inexistente → 202 sin storage ni email; 4ta request misma email → 429; 6ta misma IP → 429 |
| E2E | `tests/e2e/forgot-password.spec.ts` | `page.goto('/forgot-password')`, submit email, ve success card |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (users schema), REQ-17 (email service + template `password_reset`).
- **Bloquea a:** HU-19.2 (validación del token creado aquí).
- **Recursos compartidos:** `Astro.locals.runtime.env.DB`, `Astro.locals.runtime.env.SESSION` (KV).

## Riesgos tecnicos

- Riesgo: el `crypto.getRandomValues` no está disponible en algún runtime → Mitigación: usar `node:crypto` fallback; tests en workerd confirman.
- Riesgo: rate-limit por IP via `X-Forwarded-For` es trivial de falsear → Mitigación: Cloudflare adjunta `cf-connecting-ip`; usar ese header (`Astro.request.headers.get('cf-connecting-ip')`); documentar.
- Riesgo: KV TTL no se respeta si el namespace está en otra región → Mitigación: D1/KV de Cloudflare respetan TTL globalmente; tests integración con miniflare validan.
