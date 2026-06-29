# Diseno tecnico — HU-03.6 — Badge de verificación en perfil público

**REQ padre:** REQ-03-verificacion-prestador

## Modelo de datos

### Índice adicional

Sin nueva tabla. Agregar índice compuesto en `provider_verifications` para que la query `isVerified` sea O(1):

```ts
// src/database/schema.ts (extensión de providerVerifications)
}, (t) => ({
  ...
  byUserStatus: index('idx_provider_verifications_user_status').on(t.userId, t.status),
}))
```

Migración: `src/database/migrations/000A_verified_index.sql` con `CREATE INDEX idx_provider_verifications_user_status ON provider_verifications(user_id, status);`.

## Contrato de API

### `GET /api/v1/providers/:idOrSlug` (extendido) [público]

Response 200 (campo nuevo):
```json
{
  "id": 7,
  "slug": "juan-perez-gasfiter-las-condes",
  "name": "Juan Pérez",
  "trade": "gasfiter",
  "communes": ["Las Condes"],
  "rating_avg": 4.7,
  "verified": true,
  ...
}
```

`verified: true` sólo si existe al menos una fila en `provider_verifications` con `user_id=<provider's user_id> AND status='verificado'`.

## Validaciones Zod

No aplica (sólo lectura). El DTO público se valida implícitamente en la respuesta.

## Componentes UI

- `src/components/providers/VerifiedBadge.astro`:
  ```astro
  ---
  interface Props { verified: boolean }
  const { verified } = Astro.props
  ---
  {verified && (
    <span class="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 inline-flex items-center gap-1" data-verified="true" id="profile-verified-badge">
      <i class="ri-shield-check-fill"></i> Verificado
    </span>
  )}
  ```
- Vista pública del perfil (`/p/[slug].astro`) renderiza `<VerifiedBadge verified={provider.verified} />` en el header (cerca de `#profile-name`, según `mockups/profile.html:65-67`).

## Flujo de interaccion (secuencial)

1. Vecino anónimo (o autenticado) navega a `/p/juan-perez-gasfiter-las-condes`.
2. Server hace lookup del provider por slug.
3. Server llama `isVerified(db, provider.user_id)`.
4. Si true → renderiza `<VerifiedBadge verified={true} />` en el HTML.
5. Si false → no renderiza nada (no hay elemento con `id="profile-verified-badge"`).

## Capa de servicios

```ts
// src/lib/services/providers/verified.ts
export async function isVerified(db, providerUserId: number): Promise<boolean>

// src/lib/services/providers/index.ts (extendido)
export async function getPublicProfile(db, idOrSlug: string): Promise<PublicProviderProfile> {
  const provider = ...
  const verified = await isVerified(db, provider.userId)
  return { ...provider, verified }
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/providers/verified.test.ts` | `isVerified(db, 7)` con fila `status='verificado'` → true; con `status='rechazado'` → false; sin fila → false |
| Integracion | `tests/integration/providers/verified-flag.test.ts` | GET `/api/v1/providers/<slug>` con prestador verificado → `verified: true`; sin verificación → `verified: false` |
| E2E | `tests/e2e/profile-badge.spec.ts` | visita HTML al perfil verificado → DOM contiene `#profile-verified-badge[data-verified="true"]`; perfil no verificado → no contiene ese elemento |

## Dependencias y secuencia

- **Bloqueado por:** HU-03.2 (tabla `provider_verifications`), HU-03.5 (transición a `verificado`).
- **Bloquea a:** REQ-07 (perfil público consume este endpoint).
- **Recursos compartidos:** tabla `provider_verifications`, endpoint público de prestador.

## Riesgos tecnicos

- Riesgo: query por cada visita al perfil agrega latencia → Mitigación: el índice compuesto `(user_id, status)` la hace O(1) log(n); si profiling muestra瓶颈, agregar cache KV con TTL 5min en una HU futura.
- Riesgo: el badge expone el RUT u otro dato sensible por error → Mitigación: el componente sólo renderiza el ícono + texto "Verificado"; cero PII.
- Riesgo: el `data-verified="true"` se vuelve contract para tests → Mitigación: documentar como parte del contrato del componente; cualquier cambio debe actualizar tests E2E.
