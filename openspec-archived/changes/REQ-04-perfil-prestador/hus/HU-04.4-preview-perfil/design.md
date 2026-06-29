# Diseno tecnico — HU-04.4 — Vista preview del perfil antes de publicar

**REQ padre:** REQ-04-perfil-prestador

## Modelo de datos

No agrega tablas. Consume `providers.status` y `providers.userId` (de HU-04.1) y `providers.photo_r2_key` (HU-04.3) para renderizar la vista.

## Contrato de API

Esta HU no agrega endpoints nuevos, pero extiende dos existentes:

### `PATCH /api/v1/providers/me` (de HU-04.2)

Acepta `{ status: 'published' }` cuando el perfil cumple las precondiciones:
- `description.length >= 20` (mínimo para considerar perfil presentable)
- `photo_r2_key != null`
- `trade_id` y `commune_id` presentes
- Sesión prestador tiene verificación aprobada en REQ-03 (`verifications.status='approved'`)

Si falta alguna precondición, responde 422 con detalle del campo faltante.

### `GET /p/[slug]` (de HU-07, perfil público)

Reconoce query `?preview=true`:
- Si está ausente → comportamiento público normal (HU-07).
- Si está presente Y `Astro.locals.session.userId === provider.userId` Y `provider.status === 'draft'` → render normal + badge "VISTA PREVIA".
- En cualquier otro caso → 404 (sin filtrar la existencia del slug).

Response header adicional: `Cache-Control: no-store` cuando `preview=true`.

## Validaciones Zod

Reuso `providerPatchSchema` de HU-04.2 con la variante de `status`. No
se agregan schemas nuevos; el handler valida precondiciones con un
helper:

```ts
// src/lib/services/providers.ts
export function canPublish(p: Provider, verification: Verification | null): {
  ok: boolean
  missing: string[]
}
```

## Componentes UI

- `src/components/dashboard/provider/Preview.astro` — wrapper con iframe `src="/p/{slug}?preview=true"`, badge overlay "VISTA PREVIA", botón "Abrir en pestaña", botón "Publicar".
- `src/components/profile/PreviewBadge.astro` — banner superior `bg-yellow-100 text-yellow-800` con `ri-eye-line` "VISTA PREVIA". Sólo se monta cuando `Astro.url.searchParams.get('preview') === 'true'`.

## Flujo de interaccion (secuencial)

1. Prestador autenticado entra a `/dashboard-provider`.
2. Front hace `GET /api/v1/providers/me`. Si `status='draft'`, renderiza la sección `<Preview />` con `src="/p/{slug}?preview=true"`.
3. Iframe carga `/p/[slug]?preview=true`. Server: lee `preview=true`, valida sesión + ownership + status='draft' → 200 con `Cache-Control: no-store` y badge.
4. Prestador revisa el iframe. Click en "Publicar" → `PATCH /api/v1/providers/me { status: 'published' }`.
5. Handler valida precondiciones. Si OK → 200, status='published'. Si falta algo → 422 con detalle.
6. Al volver a `/dashboard-provider`, la sección Preview desaparece (porque ya no es draft). Perfil visible en `/p/{slug}` sin `preview` y en `/api/v1/search`.

## Capa de servicios

- `src/lib/services/providers.ts` (extiende HU-04.2):
  - `canPublish(provider, verification)` — helper de precondiciones.
- `src/lib/services/preview.ts`:
  - `authorizePreview(session, provider)` — valida `session.userId === provider.userId && provider.status === 'draft'`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/providers/preview.test.ts` | `/p/<slug>?preview=true` con sesión propia + draft → 200; sesión ajena → 404; anónimo → 404; status='published' + sesión propia → 404 |
| Integracion | `tests/integration/providers/publish.test.ts` | PATCH `status: 'published'` con descripción corta → 422; con foto + descripción + verificación → 200 |
| E2E | `tests/e2e/provider-preview.spec.ts` | Prestador autenticado navega `/dashboard-provider#preview`, ve iframe, click Publicar, ve su perfil en home |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (schema), HU-04.2 (CRUD con Zod), HU-04.3 (foto), REQ-03 (verificación para poder publicar).
- **Bloquea a:** HU-07 (perfil público) — comparte la ruta `/p/[slug].astro` que esta HU condiciona con `?preview`.
- **Recursos compartidos:** `Astro.locals.session`, componente `PreviewBadge.astro` que se monta en `/p/[slug].astro`.

## Riesgos tecnicos

- Riesgo: race condition entre "ver preview" y "publicar" — el iframe puede quedar mostrando versión vieja tras el PATCH → Mitigación: al confirmar publicación, el dashboard recarga `/dashboard-provider` (no sólo actualiza estado), lo que desmonta el iframe.
- Riesgo: 404 predecible filtra existencia de drafts → Mitigación: el response de error es idéntico al 404 de slug inexistente (mismo body genérico); verificación de seguridad en test E2E.
- Riesgo: el iframe y el dashboard quedan desincronizados tras editar perfil → Mitigación: tras `PATCH /api/v1/providers/me` exitoso, recargar el iframe via `iframe.contentWindow.location.reload()`.
