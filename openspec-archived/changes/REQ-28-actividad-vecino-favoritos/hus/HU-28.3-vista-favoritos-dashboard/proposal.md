# Propuesta — HU-28.3 — Sección Vecinos Guardados en dashboard-user

**Estado:** propuesta | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Contexto

El vecino necesita un punto único en su dashboard para reusar
prestadores de confianza con un clic directo a WhatsApp. Esta HU
reemplaza los items hardcoded del mockup `dashboard-user.html` por un
componente Astro alimentado desde `GET /api/v1/users/me/favorites`,
preservando el markup exacto del diseño. Cierra el bucle de OE2: marcar
(HU-28.2) → guardar (HU-28.1) → recuperar y contactar (esta HU).

## Mockups de referencia

- `mockups/dashboard-user.html:71-97` — sección completa "Vecinos
  Guardados". Contenedor con `lg:col-span-2`, lista
  `space-y-3`, items con `flex items-center justify-between p-3
  bg-gray-50 rounded-2xl`.
- `mockups/dashboard-user.html:72` — header con icono
  `ri-heart-line text-red-500` y título "Vecinos Guardados".
- `mockups/dashboard-user.html:75-84` — primer item: avatar circular
  con inicial (línea 77), nombre + badge de oficio coloreado
  (línea 79-81), botón WhatsApp verde redondo (línea 83).
- `mockups/dashboard-user.html:86-95` — segundo item; confirma que el
  badge cambia color según oficio (`bg-blue-100 text-blue-700` para
  Gasfiter, `bg-yellow-100 text-yellow-700` para Electricista).
- `mockups/dashboard-user.html:77` — avatar fallback:
  `w-10 h-10 rounded-full bg-white flex items-center justify-center
  text-primary font-bold shadow-sm border border-gray-100` con inicial.

## Alternativas consideradas

### Opción A — SSR completo del listado en `dashboard-user.astro`
- El page server-render consulta `listFavorites()` y renderiza
  directamente el HTML del mockup. La acción "Quitar" usa una isla
  mínima que llama al endpoint DELETE.
- Pro: primer paint instantáneo con datos reales; SEO/perf óptimos;
  reusa exactamente el markup del mockup.
- Contra: para "quitar sin recargar" hay que hidratar parcialmente la
  card; mezcla SSR con cliente.

### Opción B — Render cliente vía fetch a `GET /api/v1/users/me/favorites`
- El page envía un esqueleto y un script consume el endpoint para
  poblar la lista.
- Pro: separación clara server/cliente; endpoint reutilizable.
- Contra: flash of empty state; el dashboard es la primera vista
  autenticada, debería pintar con datos; doble código (HTML inicial +
  template cliente).

## Decisión

Opción A. El dashboard es una página autenticada cuyo valor primario es
ver los datos cuanto antes; el SSR pinta el listado real y solo hidrata
la acción "Quitar" como isla puntual. El endpoint `GET` se mantiene
para casos futuros (p. ej. infinite scroll) y para tests.

## Riesgos y mitigaciones

- Riesgo: prestador sin foto rompe el avatar → Mitigación: fallback a
  primera letra del nombre con el estilo de `mockups/dashboard-user.html:77`.
- Riesgo: prestador soft-deleted aparece como favorito → Mitigación:
  `listFavorites` (HU-28.1) ya filtra `deleted_at IS NULL`.
- Riesgo: lista vacía rompe la grilla → Mitigación: estado vacío "Aún
  no has guardado vecinos" + CTA "Buscar" con el mismo card padre
  (`bg-white rounded-3xl shadow-sm`).
- Riesgo: botón WhatsApp sin teléfono → Mitigación: si el prestador no
  tiene `phone`, ocultar el botón verde y dejar solo el card clickable
  al perfil.

## Métrica de éxito

- Sección renderiza con datos reales en primer paint (sin flash).
- Markup HTML coincide visualmente con `mockups/dashboard-user.html:71-97`
  (verificable con diff de clases Tailwind).
- "Quitar" elimina la card sin recargar y sin recargar el resto del
  dashboard.
- Click en botón WhatsApp dispara `wa.me/<phone>` y registra evento
  REQ-08.
- Coverage ≥ 90 % en el módulo.
