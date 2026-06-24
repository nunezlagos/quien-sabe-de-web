# Propuesta — HU-04.4 — Vista preview del perfil antes de publicar

**Estado:** propuesta | **REQ padre:** REQ-04-perfil-prestador

## Contexto

Antes de hacer público su perfil, el prestador necesita ver cómo lo van
a ver los vecinos. El dashboard debe mostrar un preview embebido
(`/dashboard-provider#preview`) con la página pública del perfil
(`/p/<slug>?preview=true`) marcada con un badge "VISTA PREVIA". Esa URL
NO debe quedar accesible para terceros (debe devolver 404 si no hay
sesión propia o el perfil no es draft).

## Mockups de referencia

- `mockups/dashboard-provider.html:72-75` — botón "Previsualizar Perfil Público" con `ri-eye-line`. Es el disparador del preview.
- `mockups/dashboard-provider.html:30-95` — layout del dashboard (sidebar izquierda + main panel). El bloque de preview se monta en el main panel con `id="preview-frame"`.
- `mockups/profile.html:60-90` — sidebar del perfil público (avatar, nombre, oficio, badge disponibilidad, contacto). El preview reutiliza este layout exacto.

## Alternativas consideradas

### Opcion A — Iframe a `/p/<slug>?preview=true` con verificación de sesión + status='draft'
- Server de `/p/[slug].astro` reconoce `?preview=true` y exige: (a) sesión válida, (b) sesión.userId === provider.userId, (c) provider.status === 'draft'. Si falla, 404.
- Pro: una sola ruta pública, no se duplica lógica de renderizado.
- Pro: terceros reciben 404 indistinguible de "no existe" — sin filtrar existencia del slug.
- Contra: el iframe comparte cookies con la sesión del dashboard (mismo origin), lo que es deseable.

### Opcion B — Componente Astro compartido renderizado inline en `/dashboard-provider`
- Renderizar la misma vista del perfil como partial de Astro dentro del dashboard.
- Pro: 0 requests adicionales.
- Contra: duplica la lógica de `/p/[slug].astro`; cualquier cambio de layout hay que hacerlo en dos lados.

### Opcion C — Modal overlay con snapshot estático del perfil
- Backend genera HTML estático del perfil al editar y se sirve desde `/dashboard-provider/preview`.
- Pro: cero acoplamiento con `/p/[slug].astro`.
- Contra: drift inevitable entre el preview y el real; ocuparía más memoria y complica el caché.

## Decision

Se elige **Opcion A**. El iframe con query `?preview=true` es la opción
más DRY (no duplica render) y la más segura (404 indistinguible para
terceros). La validación triple (sesión + ownership + status) es
explícita en el server de `/p/[slug].astro`.

## Riesgos y mitigaciones

- Riesgo: 404 predecible permite enumerar slugs drafts vía fuerza bruta → Mitigación: como `status='draft'` no se filtra en `/api/v1/search` ni en `GET /p/:slug` sin `?preview`, y el 404 es el mismo formato que "slug no existe", la enumeración no filtra información.
- Riesgo: iframe rompe el responsive del preview en mobile → Mitigación: usar `aspect-ratio` + `min-height` en el contenedor; permitir full-screen con un botón "Abrir en pestaña".
- Riesgo: cambios en el perfil no se reflejan en el preview porque el navegador cachea el iframe → Mitigación: `Cache-Control: no-store` para `/p/<slug>?preview=true`.
- Riesgo: publicacion accidental sin pasar por el preview → Mitigación: el botón "Publicar" en el dashboard es explícito y deshabilitado mientras `status='draft'` no tenga descripción mínima + foto.

## Metrica de exito

- Prestador autenticado con `status='draft'` entra a `/dashboard-provider#preview` → ve iframe con el perfil y badge "VISTA PREVIA".
- Visitante anónimo abre `/p/<slug>?preview=true` → 404.
- Click en "Publicar" → `PATCH /api/v1/providers/me { status: 'published' }` → 200 → el perfil aparece en búsqueda pública (REQ-06).
