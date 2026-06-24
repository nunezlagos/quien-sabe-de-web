# HU-24.5 — Design: Toggle global de pausa manual

## Schema

```ts
// src/database/schema.ts (extender tabla providers)
export const providers = sqliteTable('providers', {
  // ... campos existentes ...
  manual_availability: integer('manual_availability').notNull().default(1),
});
```

## Migración

```sql
-- src/database/migrations/00XX_providers_manual_availability.sql
ALTER TABLE providers ADD COLUMN manual_availability INTEGER NOT NULL DEFAULT 1;
-- (el CHECK constraint se valida en el validador Zod, no en SQL para mantener
-- compatibilidad con SQLite versions que no soportan CHECK en ALTER)
```

## Endpoint PATCH

```ts
// src/pages/api/v1/providers/me/availability/toggle.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { setManualAvailability } from '../../../../../lib/services/availability/toggle';

export const prerender = false;

const toggleSchema = z.object({
  enabled: z.boolean(),
});

export const PATCH: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'no autenticado' }), { status: 401 });
  if (user.role !== 'prestador') return new Response(JSON.stringify({ error: 'requiere rol prestador' }), { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'body inválido', detalles: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const providerId = await getProviderIdFromUserId(locals.runtime.env.DB, user.id);
  if (!providerId) return new Response(JSON.stringify({ error: 'prestador no encontrado' }), { status: 404 });

  await setManualAvailability(locals.runtime.env, providerId, parsed.data.enabled ? 1 : 0);

  return new Response(
    JSON.stringify({ manual_availability: parsed.data.enabled ? 1 : 0 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

## Servicio

```ts
// src/lib/services/availability/toggle.ts
export async function setManualAvailability(
  env: Env,
  providerId: number,
  enabled: 0 | 1
): Promise<void> {
  await env.DB.prepare(
    'UPDATE providers SET manual_availability = ? WHERE id = ?'
  ).bind(enabled, providerId).run();
}

export async function getManualAvailability(env: Env, providerId: number): Promise<0 | 1> {
  const row = await env.DB.prepare(
    'SELECT manual_availability FROM providers WHERE id = ?'
  ).bind(providerId).first<{ manual_availability: 0 | 1 }>();
  return row?.manual_availability ?? 1;
}
```

## Extensión de `isAvailableNow` (HU-24.3)

```ts
// src/lib/services/availability/now.ts
export function isAvailableNow(
  ranges: Array<{ day_of_week: number; start_time: string; end_time: string }>,
  manualAvailability: 0 | 1,
  now: Date,
  tz: string
): boolean {
  if (manualAvailability === 0) return false; // ← nuevo
  // resto de la lógica existente...
}
```

## Estilos del toggle (R1)

```css
/* src/styles/components.css */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 2.5rem;
  height: 1.5rem;
  background: var(--color-gray-300);
  border-radius: 9999px;
  transition: background-color 200ms;
  cursor: pointer;
  border: none;
  padding: 0;
}

.toggle-switch--on { background: var(--color-primary); }

.toggle-switch__handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 50%;
  transition: transform 200ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-switch--on .toggle-switch__handle {
  transform: translateX(1rem);
}

.toggle-switch:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Tests

### Unit (`tests/unit/availability/now-with-toggle.test.ts`)

- `isAvailableNow(ranges, 0, ...)` → `false` aunque `now` esté dentro del rango
- `isAvailableNow(ranges, 1, ...)` → mismo comportamiento que antes (HU-24.3)
- Combinación: `manualAvailability=0` gana sobre cualquier rango

### Integración

- `tests/integration/availability/migration.test.ts`:
  - Columna existe con DEFAULT 1
  - Prestador pre-existente sin `manual_availability` → queries retornan `1` (no `null`)
- `tests/integration/availability/toggle.test.ts`:
  - PATCH ON → DB actualizada a 1
  - PATCH OFF → DB actualizada a 0
  - Idempotencia (PATCH ON cuando ya está en 1)
  - 401 sin sesión
  - 403 con sesión vecino
  - 400 con body inválido

### E2E (`tests/e2e/provider-toggle-pause.spec.ts`)

- Login como prestador → toggle OFF → label cambia a "En pausa"
- Vecino busca con `available_now=true` → prestador NO aparece
- Toggle ON → vuelve a aparecer

## Convenciones aplicadas

- R1 ✓ (estilos en `components.css`)
- R2 ✓ (JS en `src/lib/client/availability/toggle.ts`)
- R3 ✓ (`AvailabilityToggle.astro` reusable)
- R4 ✓ (PascalCase + kebab-case con prefijo)