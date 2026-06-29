# HU-24.5 — Proposal: Toggle global de pausa manual

## Por qué

La disponibilidad automática (rangos semanales) cubre el 95% de los casos,
pero hay situaciones donde el prestador necesita pausar **toda** su
disponibilidad sin editar 7 filas de su horario:

- Vacaciones
- Enfermedad
- Día libre de último momento
- Mantenimiento de su herramienta principal

Un toggle simple en el sidebar es mucho mejor UX que pedirle que borre
todos sus rangos y los restaure después.

## Alternativas

| Alternativa | Pro | Contra | Decisión |
|---|---|---|---|
| **Editar horario a mano (borrar todos los rangos)** | Sin código nuevo | UX pésima, propenso a olvidar restaurar | ❌ |
| **Toggle global con prioridad sobre rangos** | 1 click pausa todo; reversible | Nueva columna + lógica en `isAvailableNow` | ✅ |
| **Estados adicionales ("vacaciones", "emergencia", etc.)** | Más granularidad | YAGNI; 1 toggle basta | ❌ |
| **Pausa con auto-expiración ("pausar por 24h")** | Más features | Complejidad extra, decisiones de producto | ❌ fase futura |

## Decisión final

Toggle binario `manual_availability` (0/1) con `DEFAULT 1`. La firma de
`isAvailableNow` se extiende a:

```ts
// antes (HU-24.3)
function isAvailableNow(ranges: Range[], now: Date, tz: string): boolean

// después
function isAvailableNow(
  ranges: Range[],
  manualAvailability: 0 | 1,
  now: Date,
  tz: string
): boolean {
  if (manualAvailability === 0) return false;
  // resto de la lógica...
}
```

## UX del toggle

Mockup a crear en `mockups/dashboard-provider.html` (gap detectado):

```html
<!-- Bloque "Estado" arriba del sidebar nav -->
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <i class="ri-toggle-line text-primary text-xl"></i>
      <span class="text-sm font-bold text-gray-700">Estado</span>
    </div>
    <!-- Toggle switch (CSS) -->
    <button type="button"
            class="toggle-switch toggle-switch--on"
            role="switch"
            aria-checked="true"
            aria-label="Cambiar disponibilidad">
      <span class="toggle-switch__handle"></span>
    </button>
  </div>
  <p class="text-xs text-gray-500 mt-2" data-toggle-label>
    Visible para vecinos
  </p>
</div>
```

## Componente `AvailabilityToggle.astro`

```astro
---
// src/components/availability/AvailabilityToggle.astro
interface Props {
  initialEnabled: boolean;
  providerId: number;
}
const { initialEnabled, providerId } = Astro.props;
---
<div class="availability-toggle"
     data-initial-enabled={initialEnabled ? 'true' : 'false'}
     data-provider-id={providerId}>
  <button type="button"
          class="toggle-switch"
          role="switch"
          aria-checked={initialEnabled ? 'true' : 'false'}
          aria-label="Cambiar disponibilidad">
    <span class="toggle-switch__handle"></span>
  </button>
  <p class="availability-toggle__label text-xs text-gray-500 mt-2">
    {initialEnabled ? 'Visible para vecinos' : 'En pausa'}
  </p>
</div>

<script>
  import { inicializarAvailabilityToggle } from '../../lib/client/availability/toggle';
  inicializarAvailabilityToggle();
</script>
```

```ts
// src/lib/client/availability/toggle.ts
import { mostrarToast } from '../ui/toast';

export function inicializarAvailabilityToggle(): void {
  document.querySelectorAll<HTMLElement>('.availability-toggle').forEach(setupToggle);
}

function setupToggle(el: HTMLElement): void {
  const btn = el.querySelector<HTMLButtonElement>('button[role="switch"]');
  const label = el.querySelector<HTMLElement>('.availability-toggle__label');
  if (!btn || !label) return;

  btn.addEventListener('click', async () => {
    const nuevoEstado = btn.getAttribute('aria-checked') !== 'true';
    // PATCH optimista
    btn.setAttribute('aria-checked', nuevoEstado ? 'true' : 'false');
    btn.classList.toggle('toggle-switch--on', nuevoEstado);
    label.textContent = nuevoEstado ? 'Visible para vecinos' : 'En pausa';

    try {
      const resp = await fetch('/api/v1/providers/me/availability/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nuevoEstado }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      // rollback
      btn.setAttribute('aria-checked', nuevoEstado ? 'false' : 'true');
      btn.classList.toggle('toggle-switch--on', !nuevoEstado);
      label.textContent = nuevoEstado ? 'En pausa' : 'Visible para vecinos';
      mostrarToast('No se pudo cambiar el estado. Reintentá.', 'error');
    }
  });
}
```

## Convenciones aplicadas

- **R1**: 0 inline styles (clases `toggle-switch`, `toggle-switch--on` en `components.css`).
- **R2**: JS del toggle extraído a `src/lib/client/availability/toggle.ts`.
- **R3**: componente `AvailabilityToggle.astro` reusable (podría usarse en futuras vistas).
- **R4**: PascalCase para componente, kebab-case para clases con prefijo `availability-` / `toggle-`.