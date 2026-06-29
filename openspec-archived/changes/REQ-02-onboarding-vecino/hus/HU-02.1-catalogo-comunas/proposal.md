# Propuesta — HU-02.1 — Catálogo de comunas RM como seed

**Estado:** propuesta | **REQ padre:** REQ-02-onboarding-vecino

## Contexto

El onboarding del vecino y el alta del prestador requieren un campo
`commune_id` válido. Sin catálogo, los formularios expondrían un input
libre y tendríamos valores inconsistentes ("Las Condes", "las-condes",
"las condes", "LAS CONDES") que rompen búsquedas y agregaciones
geográficas. La Región Metropolitana de Santiago concentra ~7M de
habitantes y el grueso de los prestadores target, por lo que partir con
las 52 comunas canónicas reduce fricción sin necesidad de API externa.

## Mockups de referencia

No tiene mockup dedicado (es schema + seed + endpoint mínimo). El campo
`commune` aparece como `<select>` en:

- `mockups/profile.html:113-116` (selector de comuna del prestador).
- Formulario de onboarding del vecino (HU-02.2, aún sin mockup).

UI a diseñar siguiendo el patrón `<select>` de los mockups existentes,
alimentado por el endpoint de esta HU.

## Alternativas consideradas

### Opción A — Seed SQL embebido en migración con `INSERT OR IGNORE`
- 52 filas literales en `0001_seed_communes.sql` ejecutadas al aplicar
  la migración.
- Pro: instalación atómica; no requiere conectividad externa.
- Pro: `INSERT OR IGNORE` mantiene idempotencia bajo re-aplicación.
- Contra: actualizar el catálogo requiere nueva migración.

### Opción B — Tabla vacía + script JS que descarga desde API externa
- API pública (ej. BCN/INE) al bootstrap; `seedCommunes(env)` la pobla.
- Pro: catálogo siempre fresco.
- Contra: añade dependencia externa y punto de falla en CI/deploy.
- Contra: requiere lógica de upsert + manejo de rate-limit.

### Opción C — Tabla vacía + archivo JSON estático en `src/data/`
- `src/data/communes-rm.json` con 52 entradas; se carga al boot.
- Pro: editable sin migración; tipado por el JSON.
- Contra: requiere lógica de carga/sincronización en cada deploy.

## Decisión

Se elige **Opción A** por simplicidad operativa y atomicidad. La
Región Metropolitana es estable (no hay creación/borrado de comunas
en el corto/mediano plazo) y migrar el catálogo ante cambios
excepcionales (comuna nueva, fusión, error tipográfico) es trivial.
El riesgo de dependencia externa de la Opción B no compensa para 52
filas.

## Riesgos y mitigaciones

- Riesgo: divergencia entre nombres oficiales (MINVU, INE, SUSESO) →
  Mitigación: usar nomenclatura INE/censo 2017 como fuente única; el
  campo `slug` derivado canónicamente con helper `slugify` (kebab-case,
  sin acentos opcional).
- Riesgo: comuna duplicada por error de dedo en seed → Mitigación:
  `UNIQUE(slug)` + `INSERT OR IGNORE`; el sabotaje en T6 detecta la fila
  repetida.
- Riesgo: cobertura inicial sólo RM → Mitigación: documentar en README
  que extender a otras regiones requiere nueva migración; el campo
  `region` permite extender sin migrar la tabla.

## Métrica de éxito

- `docker exec quien-sabe-app bun run db:migrate:local` aplica el seed
  y crea exactamente 52 filas en `communes`.
- `GET /api/v1/communes?q=las%20condes` retorna 1 fila en <50 ms p95.
- `seedCommunes(env)` ejecutado dos veces seguidas → siguen 52 filas.
- Test de sabotaje: borrar fila `"Las Condes"` → test rojo (cobertura
  ≥90% la exige) → restaurar.