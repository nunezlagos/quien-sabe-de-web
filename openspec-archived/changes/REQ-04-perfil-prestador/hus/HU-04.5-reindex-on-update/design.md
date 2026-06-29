# Diseno tecnico — HU-04.5 — Reindex de búsqueda al cambiar oficio o comuna

**REQ padre:** REQ-04-perfil-prestador

## Modelo de datos

Esta HU no agrega tablas. Consume `providers.tradeId`, `providers.communeId` (de HU-04.1) y prepara el terreno para `provider_search_index` (que HU-06.1 define).

## Contrato de API

Esta HU no expone endpoints nuevos. Extiende el comportamiento del
`PATCH /api/v1/providers/me` (de HU-04.2).

### Cambio de comportamiento del handler

```ts
// PATCH /api/v1/providers/me
const { provider, needsReindex, changedKeys } = await updateProvider(db, userId, patch)
if (needsReindex) {
  await reindexProvider(db, provider.id)   // <-- HU-06.1 provee impl
}
return json(provider, 200)
```

Los criterios de aceptación verifican que:
- `trade_id` cambia → reindex sí.
- `commune_id` cambia → reindex sí.
- `description`, `phone`, `hourly_rate_clp`, `email_public` cambian → reindex no.

## Validaciones Zod

Reusa `providerPatchSchema` de HU-04.2. No agrega schemas nuevos.

## Componentes UI

No aplica. Esta HU es backend (servicio + hook).

## Flujo de interaccion (secuencial)

1. Front hace `PATCH /api/v1/providers/me` con cambios.
2. Handler Zod-valida.
3. `updateProvider(db, userId, patch)`:
   - Carga fila actual.
   - Compara patch vs fila actual; construye `changedKeys`.
   - `needsReindex = changedKeys.some(k => k === 'tradeId' || k === 'communeId')`.
   - Aplica `UPDATE`.
   - Retorna `{ provider, needsReindex, changedKeys }`.
4. Si `needsReindex`, `await reindexProvider(db, provider.id)`. Si lanza, loggear y continuar (reindex es best-effort, no debe romper el PATCH).
5. Devuelve 200 con el perfil actualizado.

## Capa de servicios

- `src/lib/services/search/indexer.ts` (firmas, HU-06.1 implementa el cuerpo):
  - `reindexProvider(db, providerId): Promise<void>` — recalcula `provider_search_index` para esa fila (o upsert si la vista materializada existe).
- Extiende `src/lib/services/providers.ts` (HU-04.2):
  - `updateProvider(db, userId, patch): Promise<{ provider: Provider; needsReindex: boolean; changedKeys: string[] }>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/update-provider.test.ts` | `changedKeys` correcto para cada combinación de patch; `needsReindex=true` sólo si `tradeId` o `communeId` cambia |
| Unit | `tests/unit/search/indexer.test.ts` | `reindexProvider` llama al upsert de la vista con los datos del provider cargado |
| Integracion | `tests/integration/providers/reindex.test.ts` | Spy sobre `reindexProvider`: PATCH `trade_id` → 1 call; PATCH `description` → 0 calls; PATCH `commune_id` → 1 call |
| Integracion | `tests/integration/search/reflects-update.test.ts` | Tras PATCH `trade_id`, `GET /api/v1/search?trade=<nuevo>` lo retorna; `?trade=<viejo>` ya no |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.2 (CRUD), HU-06.1 (define la firma `reindexProvider`; en HU-04.5 se inyecta un stub testeable).
- **Bloquea a:** HU-06.1 debe implementar `reindexProvider`; mientras tanto, HU-04.5 entrega el contrato + tests con spy.
- **Recursos compartidos:** `src/lib/services/providers.ts`, `src/lib/services/search/indexer.ts`.

## Riesgos tecnicos

- Riesgo: `updateProvider` no detecta diff cuando el valor nuevo es `null` o string vacío → Mitigación: comparación con `Object.is` o `!==` estricta; test explícito para `description: ''`.
- Riesgo: reindex falla (ej: D1 timeout) y el PATCH devuelve 500 → Mitigación: `try/catch` alrededor de `reindexProvider`, log de error, PATCH retorna 200 igual; el indexer tiene una suite de tests de aceptación (HU-06.7) que detecta el drift eventualmente.
- Riesgo: si dos PATCH concurrentes al mismo provider, race en `changedKeys` → Mitigación: el `UPDATE` es atómico en D1; el segundo PATCH lee la versión ya actualizada, su diff es vacío, `needsReindex=false` y no hay reindex duplicado.
