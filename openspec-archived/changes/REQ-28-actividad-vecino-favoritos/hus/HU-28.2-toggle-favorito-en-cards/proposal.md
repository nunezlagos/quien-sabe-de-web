# Propuesta — HU-28.2 — Botón corazón en cards de index y profile

**Estado:** propuesta | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Contexto

El vecino necesita un gesto rápido (un clic) para marcar prestadores
como favoritos desde dos superficies: el listado de `/` y el header del
perfil público `/p/:slug`. Esta HU expone el toggle (POST/DELETE) y el
componente `<FavoriteButton />` que se monta sobre las cards y el
header del perfil. Vincula al objetivo OE2 (fidelización del vecino) y
es prerrequisito directo de HU-28.3 (la sección dashboard no tiene qué
mostrar si no hay forma de marcar).

## Mockups de referencia

- `mockups/index.html:317-375` — `template id="grid-card-template"` con
  la card de prestador. El corazón se inserta en la zona del header de
  la card (junto al rating en línea 339-341) o como acción flotante.
- `mockups/index.html:362-372` — bloque de botones existentes
  (`profile-link`, `email-link`, `whatsapp-link`); el corazón usa el
  mismo lenguaje visual (`w-10 h-10 rounded-full ... transition`).
- `mockups/dashboard-user.html:72` — estilo de referencia para corazón
  activo: `i class="ri-heart-line text-red-500"` (estado vacío) y
  `ri-heart-fill text-red-500` (activo).
- `mockups/profile.html:60-104` — header del perfil donde se inserta el
  corazón junto al botón "Contactar" (línea 93). UI a diseñar siguiendo
  este estilo: botón circular `w-8 h-8 rounded-full bg-red-100
  text-red-600 hover:bg-red-500 hover:text-white transition`.
- `mockups/js/home.js:97-220` — `createNeighborCard()` clona el template
  por cada prestador; el corazón debe poder leer `provider.id` y
  estado inicial `isFavorite` desde data attributes en SSR.

## Alternativas consideradas

### Opción A — Componente Astro con isla cliente mínima
- `<FavoriteButton providerId initialActive />` renderiza el SVG y un
  `<script>` islote (`client:load`) que ataca el endpoint con fetch y
  hace optimistic update.
- Pro: integra naturalmente con Astro SSR; estado inicial llega ya
  resuelto; sin framework extra.
- Contra: requiere un pequeño módulo cliente (`src/lib/client/favorites.ts`)
  para encapsular la llamada y el rollback.

### Opción B — Web Component independiente
- Definir `<favorite-button>` como custom element vanilla que se hidrate
  solo y consulte estado vía un endpoint `/api/v1/.../is-favorite`.
- Pro: máxima reusabilidad framework-agnostic.
- Contra: doble round-trip al cargar (uno por card); más complejo
  hidratar dentro de templates clonados; no aprovecha SSR.

## Decisión

Opción A. El estado inicial llega desde el server (evitando flicker y
N+1 al hidratar), el optimistic update es trivial y se mantiene la
filosofía Astro de "islas mínimas". El cliente reusa un único helper en
`src/lib/client/favorites.ts`.

## Riesgos y mitigaciones

- Riesgo: visitante sin sesión clica el corazón → Mitigación: el
  endpoint responde 401, el cliente abre el modal de login de REQ-01.
- Riesgo: doble clic crea estado inconsistente → Mitigación: optimistic
  update con bloqueo del botón mientras hay request en vuelo; el
  endpoint POST/DELETE es idempotente por PK compuesta (HU-28.1).
- Riesgo: el corazón en `index.html` no encaja en `grid-card-template`
  ni `list-card-template` → Mitigación: insertarlo dentro del header de
  la card (línea 322 del mockup) como botón absoluto en esquina, sin
  romper el flex existente.

## Métrica de éxito

- Toggle on/off funciona con un solo clic (P95 < 200 ms en red local).
- Llamadas repetidas devuelven 200 sin duplicar filas (verificable con
  query `SELECT count(*) FROM user_favorites WHERE ...`).
- Sin sesión, clic abre modal de login y no impacta la DB.
- Type check verde, tests integración + E2E verdes.
