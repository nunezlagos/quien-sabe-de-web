# Propuesta — HU-16.3 — Renderizar /terms con version

**Estado:** propuesta | **REQ padre:** REQ-16-paginas-estaticas

## Contexto

Los Términos y Condiciones son el contrato legal base de la plataforma. La
página `/terms` debe (a) renderizarse desde la content collection, (b) mostrar
la versión vigente (`version: "vN"` del frontmatter) y (c) registrar la
versión en una nueva tabla `legal_versions` para que HU-16.6 pueda detectar
cuándo un usuario quedó desactualizado y forzar re-aceptación. El mockup
`mockups/terms.html:42-68` ya define la estructura visual con 4 secciones y
un pie de "Última actualización".

## Mockups de referencia

- `mockups/terms.html:40-70` — card blanca con H1, secciones enumeradas y pie de fecha.
- `mockups/verification.html:27-37` — patrón de hero con primary color (reusable para `LegalLayout`).

## Alternativas consideradas

### Opcion A — Insert en `legal_versions` al render, idempotente
- Vista `src/pages/terms.astro` llama `getEntry("legal","terms")` y `ensureLegalVersion(slug, version)`.
- `ensureLegalVersion` hace `INSERT OR IGNORE` (o `ON CONFLICT DO NOTHING`) por `(slug, version)`.
- Pro: registrar la versión no depende de cron, no requiere script manual, queda auditable en D1 desde el primer render.
- Contra: en SSG puro, `getEntry` se evalúa en build y el `INSERT` correría una vez por build — no en cada request. Esto es aceptable porque la meta es auditar qué versión está publicada, no qué versión vio cada usuario.

### Opcion B — Script CLI separado `bun run legal:publish`
- Operador corre el script manualmente al hacer bump de versión.
- Pro: control explícito.
- Contra: humano忘记, deriva entre copy y tabla. Mayor fricción.

### Opcion C — Versionado en el nombre de archivo (`terms-v2.md`)
- El filesystem define la versión.
- Pro: trivial de auditar con `ls`.
- Contra: rompe la API de `getEntry("legal","terms")` y el contrato de HU-16.1 (un archivo por documento).

## Decision

Se elige **Opcion A**. El helper `ensureLegalVersion` se invoca en el
frontmatter de la vista; en SSG corre una vez por build, suficiente para que
la tabla `legal_versions` refleje la versión publicada. La idempotencia
(`ON CONFLICT DO NOTHING`) garantiza que re-builds no generen duplicados.

## Riesgos y mitigaciones

- Riesgo: la migración `legal_versions` aún no existe → Mitigación: HU-16.6 la crea; HU-16.3 se apoya en esa migración con precondición explícita en tasks.
- Riesgo: dos versiones distintas publicadas en builds consecutivos no se "cierran" → Mitigación: HU-16.6 introduce la lógica de "versión vigente vs publicadas"; HU-16.3 solo inserta.
- Riesgo: el `INSERT` se ejecute en cada request SSR y sature D1 → Mitigación: en esta HU, la vista se prerendera (`export const prerender = true`); SSR solo si HU-16.6 lo requiere más adelante.

## Metrica de exito

- `GET /terms` → 200, HTML contiene "Versión: v1" (o la vigente) y "Última actualización".
- Tras `astro build`, la tabla `legal_versions` contiene exactamente la fila `(slug="terms", version="v1")` y no se duplica en un segundo build.
- Test integración verifica el `INSERT` y la idempotencia con `INSERT OR IGNORE` / `ON CONFLICT DO NOTHING`.
