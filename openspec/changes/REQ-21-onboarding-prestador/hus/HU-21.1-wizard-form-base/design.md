# Diseño técnico — HU-21.1 — Port del wizard create-trade desde mockup

**REQ padre:** REQ-21-onboarding-prestador

## Modelo de datos

No aplica. Esta HU no introduce tablas. Las columnas `display_name`, `whatsapp`, `base_price_clp` de `providers` se persisten en HU-21.3 vía `POST /api/v1/providers/me`.

## Contrato de API

No aplica. El `<form>` apunta a `action="/api/v1/providers/me"` con `method="POST"` pero el handler se implementa en HU-21.3. Esta HU sólo garantiza que el HTML del form existe con los `name` correctos (`displayName`, `tradeId`, `bio`, `whatsapp`, `basePriceClp`, `communeIds[]`).

## Validaciones Zod

No aplica en frontend. El form usa `required` HTML5 nativo en los inputs (`displayName`, `tradeId`, `whatsapp`, `basePriceClp`) para bloquear submit vacío a nivel browser. Las validaciones de tipo (regex WhatsApp, bio ≤ 500) viven en el servicio de HU-21.3.

## Componentes UI

### Vista Astro
- `src/pages/create-trade.astro` — layout `src/layouts/Layout.astro`, fondo `bg-bg-light`, container `max-w-2xl mx-auto px-4 py-8`.
- Verificación de sesión en SSR: si no hay sesión válida → redirect `Astro.redirect('/login?next=/create-trade')`. Si la sesión ya tiene `providers.status="approved"` → redirect `/dashboard-provider` (evita doble creación).

### Componente Astro
- `src/components/onboarding/ProviderWizard.astro` — props: `{ trades: Array<{id, name}>, communes: Array<{id, name}> }`.
  - Renderiza los 3 cards del mockup usando los `props.trades` y `props.communes` para popular los `<select>` (HU-21.2 inyecta los datos; aquí la HU sólo deja la estructura preparada para recibirlos).
  - Bloque 1 (`mockups/create-trade.html:52-77`): Nombre Visible, Oficio (`<select name="tradeId">`), Bio (`textarea rows="2" name="bio"`).
  - Bloque 2 (`mockups/create-trade.html:80-99`): WhatsApp (`<input type="tel" name="whatsapp" placeholder="12345678">` con prefix `+56 9`), Precio Base (`<input type="number" name="basePriceClp">` con prefix `$`).
  - Bloque 3 (`mockups/create-trade.html:102-109`): dropzone Certificado (placeholder; el upload real se conecta en HU-21.3 con `name="certificateFile"` opcional).
  - Footer (`mockups/create-trade.html:111-116`): dos botones `flex-1` "Volver" (`href="/dashboard-user"`) y `flex-[2]` "Crear Perfil" (`type="submit"`, id `provider-wizard-submit`).
  - Estilos heredados literal: `bg-white p-6 rounded-2xl shadow-sm border border-gray-100` para cards, `bg-bg-light font-sans` para body.

### Slots para extensión HU-21.2
- Slot `cobertura` entre bloque 1 y bloque 2 para el multi-select de comunas (no se renderiza en esta HU; queda preparado en el componente padre).

## Flujo de interacción (secuencial)

1. Usuario autenticado navega a `/create-trade`.
2. SSR verifica sesión, lee `trades` y `communes` desde D1 (llamadas a HU-21.2 ya implementadas).
3. Renderiza `ProviderWizard` con los catálogos como props.
4. Usuario completa los inputs; browser bloquea submit si falta `displayName`, `tradeId`, `whatsapp` o `basePriceClp` (HTML5 `required`).
5. Submit → POST `/api/v1/providers/me` (HU-21.3). Esta HU no implementa el handler, sólo garantiza que el `action` está bien cableado.
6. Si la respuesta es 201, el cliente navega a `/verification` (HU-21.4). Si es 5xx, toast rojo y permanece en la página.

## Capa de servicios

No aplica. Esta HU no introduce servicios nuevos. Las llamadas a `listTrades()` y `listCommunes()` se hacen en el SSR de la página vía los servicios de HU-21.2.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| E2E | `tests/e2e/create-trade-render.spec.ts` | Render fiel al mockup (3 cards, headings, inputs con `name` correctos, botones), responsive 375px vs 1280px, redirect sin sesión a `/login`. |
| Unit | `tests/unit/onboarding/provider-wizard.test.ts` (opcional) | Props `trades` y `communes` se inyectan en los `<select>` sin alterar el markup base. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión), REQ-02 (catálogo de comunas), HU-21.2 (catálogo de oficios cargado dinámicamente en los `<select>`).
- **Bloquea a:** HU-21.2 (inserta la sección Cobertura), HU-21.3 (handler POST), HU-21.4 (redirect post-submit).
- **Recursos compartidos:** `src/layouts/Layout.astro`, tokens `tailwind.config` (primary `#2E8B57`, accent `#FF7F50`, bg-light `#eaeff2`, font Nunito).

## Riesgos técnicos

- Riesgo: HTML del mockup usa `<script src="https://cdn.tailwindcss.com">` que no aplica en Astro → Mitigación: importar Tailwind v4 vía `@import "tailwindcss"` (gestionado por Vite/Astro) en `Layout.astro`.
- Riesgo: Remix Icons cargados por CDN pueden no estar offline-friendly → Mitigación: usar el CSS local `mockups/css/remixicon.css` o instalar `@iconify-json/ri` (decisión del equipo, no bloqueante).
- Riesgo: `flex-1` vs `flex-[2]` en botones no respeta proporción exacta → Mitigación: snapshot Playwright verifica la proporción con `getBoundingClientRect()`.