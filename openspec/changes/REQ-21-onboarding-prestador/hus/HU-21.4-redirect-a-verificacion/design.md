# Diseño técnico — HU-21.4 — Redirect post-wizard a /verification

**REQ padre:** REQ-21-onboarding-prestador

## Modelo de datos

No aplica. Esta HU es cliente puro.

## Contrato de API

Consumido, no definido:
- `POST /api/v1/providers/me` (HU-21.3) — devuelve 201 con `{id, status}` en éxito, 4xx/5xx con `{error}` en fallo.

## Validaciones Zod

No aplica en cliente. El navegador usa HTML5 `required` (HU-21.1) como primera línea; la validación server-side (HU-21.3) cubre los casos patológicos.

## Componentes UI

### Módulo cliente
- `src/lib/client/onboarding.ts` — exporta `submitProviderWizard(form: HTMLFormElement): Promise<void>`.
  - `event.preventDefault()`.
  - `submitButton.disabled = true; submitButton.textContent = 'Enviando...'`.
  - `const formData = new FormData(form)` → convertir a JSON payload (con `communeIds` como `number[]` extraído de los `communeIds[]` checkbox values).
  - `const response = await fetch('/api/v1/providers/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`.
  - Si `response.status === 201`: `window.location.assign('/verification')`.
  - Si `response.status === 422`: leer body `{error, field}` y mostrar mensaje inline junto al campo; restaurar botón.
  - Si `response.status >= 500`: mostrar toast rojo "Algo salió mal, intenta de nuevo"; restaurar botón.
  - `catch (e)`: mostrar toast rojo genérico.

### Integración en `create-trade.astro`
- Bloque `<script>` al final que hace `document.getElementById('provider-wizard-form')?.addEventListener('submit', (e) => submitProviderWizard(e.target as HTMLFormElement))`.

### Toast
- Reutilizar el set de clases `bg-white shadow-lg border border-gray-100 rounded-2xl p-4 flex items-start gap-3` (consistente con banner de HU-21.5).
- Render dinámico: `<div id="toast" class="fixed bottom-6 right-6 ..." hidden>` con `role="alert"` y `aria-live="polite"`.

## Flujo de interacción (secuencial)

1. Usuario autenticado en `/create-trade` completa el form.
2. Click "Crear Perfil" → `submit` event → `submitProviderWizard`.
3. Botón se deshabilita; texto cambia a "Enviando...".
4. `fetch` POST con payload.
5. **Camino feliz (201)**: `window.location.assign('/verification')`. Browser navega; el dashboard de HU-21.5 se actualizará en próxima visita.
6. **Error de validación (422)**: mostrar mensaje inline junto al campo problemático (`<span class="text-red-500 text-xs mt-1">` debajo del input).
7. **Error de servidor (5xx)**: mostrar toast rojo bottom-right con texto "No pudimos guardar tu perfil. Intenta de nuevo." y auto-dismiss tras 5s.

## Capa de servicios

No aplica. Esta HU es cliente puro. La lógica de "ya tienes perfil" se maneja en HU-21.3 (403 server-side) → cliente mapea a toast "Ya tienes un perfil activo".

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/client/onboarding.test.ts` (con jsdom) — `submitProviderWizard` mockeando `fetch`: 201 → llama `window.location.assign('/verification')`; 422 → muestra mensaje inline; 500 → muestra toast; red caída → muestra toast genérico. |
| E2E | `tests/e2e/create-trade-flow.spec.ts` — login vecino verificado → completa wizard (mockeando catálogo) → submit → URL final = `/verification`. |
| E2E | `tests/e2e/create-trade-error.spec.ts` — submit con POST mockeado a 500 → permanece en `/create-trade` con toast visible; submit con doble click rápido → un solo POST sale a la red (segundo click ignorado). |

## Dependencias y secuencia

- **Bloqueado por:** HU-21.1 (form con `name` correctos), HU-21.3 (endpoint POST funcional).
- **Bloquea a:** ninguna HU directa; consumida por REQ-03 (verification).
- **Recursos compartidos:** `src/lib/client/`, layout global.

## Riesgos técnicos

- Riesgo: `window.location.assign` vs `replace` → Mitigación: usar `assign` para que el botón "Atrás" del browser lleve al dashboard-user, no a un re-submit.
- Riesgo: el toast tapa el botón submit en mobile → Mitigación: posición `bottom-6 right-6` con `z-50` no interfiere con form en viewport estándar; test E2E valida.
- Riesgo: payload no incluye `commune_ids` correctamente cuando hay 0 checks (cliente debería bloquear antes) → Mitigación: si `commune_ids.length === 0`, abortar antes del fetch con mensaje "Selecciona al menos una comuna".