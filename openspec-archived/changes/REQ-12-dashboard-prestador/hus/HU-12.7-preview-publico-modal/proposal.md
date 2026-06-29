# Propuesta — HU-12.7 — Preview público en modal iframe

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita comprobar cómo se ve su perfil público sin perder el contexto del dashboard. Reducir el ciclo "edito → guardo → reviso" sustenta OE1 al mejorar la velocidad de iteración del contenido.

## Mockups de referencia

- `mockups/dashboard-provider.html:71-75` — botón "Previsualizar Perfil Público" (`id="preview-profile-btn"`).
- `mockups/dashboard-provider.html:443-468` — modal de preview con `id="preview-modal"`, header oscuro y `iframe` (`#preview-iframe`).
- `mockups/dashboard-provider.html:448-461` — toolbar del header: badge "Vista Previa", switches móvil/escritorio, botón cerrar (`#close-preview-btn`).
- `mockups/dashboard-provider.html:464-466` — `<iframe src="profile.html?id=1&preview=true">` que en runtime apunta a `/p/<slug>?preview=true`.
- `mockups/dashboard-provider.html:543-558` — lógica JS de apertura/cierre y refresh forzado del iframe.

## Alternativas consideradas

### Opcion A — Modal con `<iframe>` apuntando a `/p/:slug?preview=true`
- Reuso completo de la vista pública con flag `preview=true` (REQ-04.4).
- Pro: 100% fidelidad visual con lo que ve el cliente; cero código duplicado.
- Contra: depende de que la ruta pública acepte `preview=true` para no contabilizar como vista.

### Opcion B — Render server-side embebido (sin iframe)
- Componente Astro que rehidrata la vista pública dentro del modal.
- Pro: estilos compartidos sin iframe, mejor accesibilidad.
- Contra: requiere refactor pesado, riesgo de divergencia con la vista real.

## Decision

Se adopta **Opcion A** porque coincide con el mockup, garantiza paridad visual con la vista pública y aísla estilos. El parámetro `preview=true` evita registrar `profile_views` y permite a la vista pública detectar el contexto (banner "Vista Previa" si se desea).

## Riesgos y mitigaciones

- Riesgo: el iframe muestra datos cacheados. Mitigación: forzar `iframe.src = iframe.src` al abrir el modal (`mockups/dashboard-provider.html:550-553`).
- Riesgo: contabilizar la vista como real e inflar métricas. Mitigación: el endpoint que registra vistas debe ignorar requests con `preview=true` proveniente del propio prestador (validado por sesión + slug).
- Riesgo: scroll del dashboard se pierde al cerrar. Mitigación: cuerpo del body conserva scroll (modal sólo aplica `overflow:hidden` mientras está abierto y se restaura al cerrar).

## Metrica de exito

- Click en "Previsualizar Perfil Público" abre modal con iframe cargando `/p/<slug>?preview=true` en menos de 1 s.
- Cerrar el modal mantiene scroll del dashboard exacto al previo a abrirlo.
- Editar la biografía (HU-12.3) y reabrir preview muestra el cambio.
- Las visitas en `preview=true` no incrementan `profile_views`.
