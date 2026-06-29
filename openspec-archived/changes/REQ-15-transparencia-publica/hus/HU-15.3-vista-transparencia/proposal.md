# Propuesta — HU-15.3 — Vista pública /transparency con widgets

**Estado:** propuesta | **REQ padre:** REQ-15-transparencia-publica

## Contexto

Es la cara pública del compromiso OE3: cualquier visitante anónimo, sin login, debe poder verificar en qué se gastan las donaciones recibidas. Sin esta página el resto del REQ (CRUD admin, PDF, cron) no tiene consumidor. Debe renderizar widgets agregados y la tabla histórica sin filtrar PII de donantes.

## Mockups de referencia

- `mockups/transparency.html:30-38` — nav simplificada con enlace "Volver" (sin login).
- `mockups/transparency.html:40-44` — encabezado "Transparencia Total" + subtítulo.
- `mockups/transparency.html:46-59` — grid de 3 tarjetas: Ingresos este mes, Gastos Fijos, Fondo Reserva (verde / rojo / azul).
- `mockups/transparency.html:61-98` — card "Historial de Gastos" con badge "Actualizado hoy" y tabla columnas: Fecha, Concepto, Monto, Comprobante.
- `mockups/transparency.html:102-130` — footer banner con imagen + enlaces "Donaciones / Términos / Transparencia".

## Alternativas consideradas

### Opción A — SSR Astro + endpoint JSON cacheado en KV
- `transparency.astro` consume el endpoint `GET /api/v1/public/transparency/summary` desde el servidor en cada request; el endpoint cachea su respuesta 5 min en KV.
- Pro: HTML completo en primer paint (SEO + accesibilidad), datos agregados consistentes, cero JS para renderizar widgets.
- Contra: si KV miss, primer visitante paga el costo de agregación.

### Opción B — Static rendering + revalidación on-demand
- Página renderizada estáticamente al deploy; invalidación al mutar `expenses` o al cerrar mes.
- Pro: latencia mínima en cualquier región.
- Contra: Astro en modo `output: 'server'` no soporta ISR; haría falta un build trigger por cada admin POST/PATCH/DELETE; flujo frágil.

## Decisión

Se elige Opción A. El proyecto ya está en modo `server` (ver `astro.config.mjs` y `CLAUDE.md`), KV está disponible vía bindings, y un TTL de 5 min basta para una página de baja escritura. Mantiene un único pipeline de datos consistente con HU-15.2 (mutaciones invalidan la key KV).

## Riesgos y mitigaciones

- Riesgo: filtrado de PII de donantes en el JSON expuesto → Mitigación: el endpoint solo SELECTea agregados (`SUM`, `COUNT`); test de integración valida que el payload no contiene `email` ni `name`.
- Riesgo: tabla "Historial de Gastos" crece y rompe layout → Mitigación: paginar a 50 por página con cursor opaco; mockup mantiene presentación simple.
- Riesgo: enlace "Ver Boleta" expone URL R2 directa → Mitigación: HU-15.6 emite presigned URLs de 1 h; este componente solo renderiza si `document_r2_key` está presente.
- Riesgo: stampede de cache al expirar TTL → Mitigación: SWR — servir valor stale mientras se revalida en background.

## Métrica de éxito

- `GET /transparency` retorna HTML con los 3 widgets y la tabla en menos de 200 ms (con KV hit).
- Test de integración confirma que la respuesta JSON no contiene campos PII.
- Test E2E Playwright: visitante anónimo (sin cookies) carga la página y ve totales mayores a cero (con fixtures).
