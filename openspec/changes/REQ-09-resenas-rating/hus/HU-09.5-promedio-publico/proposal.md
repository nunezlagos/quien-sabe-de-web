# Propuesta — HU-09.5 — Promedio público y filtro por rating

**Estado:** propuesta | **REQ padre:** REQ-09-resenas-rating

## Contexto

El promedio de reseñas es uno de los dos números más visibles de un prestador (junto con el contador). Debe ser siempre actual y excluir las reseñas ocultas por moderación (HU-09.6). El cálculo se hace en SQL (`AVG(rating)` filtrado por `status='visible'`), con `null` cuando no hay reseñas. El promedio se expone en el endpoint público de HU-07.1 (perfil) y se usa como filtro en el buscador (REQ-06). El cache edge (HU-07.6) lo cubre con TTL 60s; en invalidación inmediata basta con esperar.

## Mockups de referencia

- `mockups/profile.html:84-89` — header con rating y contador "reseñas recibidas" / "opiniones" (consumido por HU-07.1).
- `mockups/index.html:328-357` — cards del home donde aparece el rating como filtro social.

## Alternativas consideradas

### Opcion A — Cálculo en SQL cada vez + cache edge con TTL 60s
- `SELECT AVG(rating) FROM reviews WHERE provider_id=? AND status='visible'` en cada request al endpoint de perfil.
- Cache edge TTL 60s ya existente.
- Pro: simple; AVG es barato con índice `(provider_id, status)`.
- Contra: cache puede mostrar promedio desactualizado hasta 60s tras crear/ocultar reseña.

### Opcion B — Promedio materializado en `providers.rating_avg` + trigger de recálculo
- Columna denormalizada; trigger tras INSERT/UPDATE/DELETE en `reviews` actualiza el valor.
- Pro: lectura inmediata, sin cache.
- Contra: D1 / SQLite no tiene triggers nombrados robustos; complica migraciones.
- Contra: cualquier error de mantenimiento deja el valor desincronizado.

### Opcion C — Promedio calculado en cliente (JS) a partir del GET de reseñas
- Pro: cero cambios backend.
- Contra: la página de perfil (HU-07.1) sólo trae 10 reseñas vía la lista — el promedio sería parcial.

## Decision

Se elige **Opcion A**. El índice `(provider_id, status, created_at DESC, id DESC)` cubre la query; AVG con 1000 filas toma < 5 ms. Cache edge 60s ya cubre el caso de invalidación "rápida". Si el volumen crece y la latencia p95 supera 50 ms, se materializa (REQ futuro).

## Riesgos y mitigaciones

- Riesgo: una reseña oculta sigue contando en el promedio por un breve período (cache TTL 60s) → Mitigación: aceptable; el admin que oculta debe saber que el efecto tarda hasta 60s en el público. Documentar.
- Riesgo: el promedio de un prestador con miles de reseñas es lento → Mitigación: medir; si supera 50 ms p95, materializar.
- Riesgo: el filtro `min_rating` en el buscador (REQ-06) usa el mismo cálculo → Mitigación: la query es la misma; sin duplicación.
- Riesgo: cambio de schema en HU-09.6 (ocultar reseña) no invalida el cache → Mitigación: PATCH hide debe hacer `cache.purge('/p/<slug>')` (fuera de scope de esta HU; queda como follow-up).

## Metrica de exito

- Promedio calculado en SQL excluye `status='hidden'` → test e2e: ocultar reseña cambia el promedio.
- Sin reseñas → `ratingAvg: null` en el response de HU-07.1.
- Tras INSERT de nueva reseña, el siguiente GET al endpoint (sin cache miss) refleja el nuevo promedio.
- Latencia p95 del endpoint de perfil ≤ 100 ms con 100 reseñas seed.
