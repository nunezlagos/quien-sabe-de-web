# Propuesta — HU-21.2 — Selector de oficio y multi-comuna

**Estado:** propuesta | **REQ padre:** REQ-21-onboarding-prestador

## Contexto

El mockup `mockups/create-trade.html` tiene el campo "Oficio" pero no expone selección de comuna: el REQ-21 necesita cobertura multi-comuna persistida en `provider_communes` para alimentar el buscador por comuna (REQ-06). Esta HU entrega los dos catálogos públicos (`/api/v1/catalog/trades` y `/api/v1/catalog/communes`), los seeds Drizzle con los datos de `mockups/js/data.js:2-16`, la tabla `provider_communes`, y el componente `MultiCommuneSelector` que se inserta en el slot dejado por HU-21.1.

## Mockups de referencia

- `mockups/create-trade.html:60-71` — `<select>` de oficio con opciones literales (Gasfiter, Electricista, Jardinero, Maestro, Costurera, Otro).
- `mockups/js/data.js:2-10` — `tradesList` canónica (7 oficios). Es la single source of truth para el seed.
- `mockups/js/data.js:12-16` — `communesList` canónica (14 comunas RM iniciales).
- `mockups/dashboard-user.html:53-65` — CTA "Crear Perfil PRO" previo, indica que el usuario ya eligió la acción de crear perfil.

## Alternativas consideradas

### Opción A — Endpoints GET públicos + tabla `provider_communes` con PK compuesta
- `GET /api/v1/catalog/trades` y `/communes` devuelven JSON con `id` y `name`. La cobertura se persiste en una tabla puente `provider_communes(provider_id, commune_id)` con `PRIMARY KEY (provider_id, commune_id)`.
- Pro: lookup por catálogo es O(1) sin JOIN pesados; PK compuesta previene duplicados.
- Pro: el catálogo vive en D1 (no en JSON estático), así admin puede agregar oficios sin redeploy.
- Contra: requiere 2 seeds (`trades.ts` y `communes.ts`) y 1 migración para `provider_communes`.

### Opción B — Catálogo embebido en `mockups/js/data.js` y exportado como constante TS
- El servidor importa `tradesList` y `communesList` directo desde el archivo del mockup (que ya está bien definido).
- Pro: cero migración de datos, zero código de seed.
- Contra: para agregar un oficio hay que hacer commit + redeploy; REQ-22 (admin) tendría que editar el repo en vez de una fila en D1.

### Opción C — Tabla única `provider_trade_communes` (sin `provider_communes` aparte)
- Pro: una sola tabla con todo.
- Contra: rompe el principio "cada relación con su tabla" del proyecto; complica queries de "todos los prestadores que cubren la comuna X" (REQ-06).

## Decisión

Se elige **Opción A**. El catálogo en D1 habilita la edición admin futura (HU-13.x) y mantiene los seeds como datos de bootstrap, no como runtime. La PK compuesta `(provider_id, commune_id)` es la forma canónica de modelar relación N:M en SQL relacional y Drizzle la soporta nativamente.

## Riesgos y mitigaciones

- Riesgo: el oficio "Otro" (mockup línea 69) requiere free-text que admin aprueba → Mitigación: el `<option value="otro">` queda marcado con `data-requires-spec="true"`; HU-21.3 detecta ese valor y abre un sub-formulario, enviando `tradePendingApproval: string` separado.
- Riesgo: 14 comunas seed no cubren la RM completa → Mitigación: REQ-02 tiene la versión extendida (52 comunas); esta HU usa `communesList` por port fiel del mockup, y REQ-02 provee el seed ampliado que se inyecta vía el endpoint público.
- Riesgo: el catálogo se vuelve pesado si crece a cientos de oficios → Mitigación: el endpoint público responde con `Cache-Control: public, max-age=3600`; refetch cliente al primer load de la sesión.

## Métrica de éxito

- `GET /api/v1/catalog/trades` devuelve `[{id:1,name:"Gasfiter"}, ..., {id:7,name:"Costurera"}]` con `Cache-Control: public, max-age=3600`.
- `GET /api/v1/catalog/communes` devuelve los 14 comunas en el mismo orden que `mockups/js/data.js:12-16`.
- Submit del wizard con 3 comunas genera 3 filas en `provider_communes` (verificado en test de integración HU-21.3).
- Sabotaje: borrar el `INSERT OR IGNORE` del seed → segundo arranque de migraciones inserta duplicados y la PK compuesta falla → restaurar.