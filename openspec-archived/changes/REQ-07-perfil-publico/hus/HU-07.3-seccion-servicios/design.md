# Diseno tecnico — HU-07.3 — Sección de catálogo de servicios en perfil

**REQ padre:** REQ-07-perfil-publico

## Modelo de datos

No introduce tablas. Lee de `services` y `service_coverage` (REQ-05) vía el DTO `PublicProvider.services` (HU-07.1).

DTO consumido (subset):

```ts
type PublicService = {
  id: number;
  name: string;
  priceClp: number | null;
  description?: string | null;
  coverage: string[]; // nombres de comunas ya resueltos
};
```

Nota: HU-07.1 hoy entrega sólo `id, name, priceClp`. Esta HU exige extender ese DTO con `description` y `coverage[]`. Se hace como parte del PR de esta HU (un cambio retrocompatible al DTO).

## Contrato de API

No añade endpoints. Cambia el shape de `PublicService` en HU-07.1 — se documenta en el changelog del PR.

## Validaciones Zod

No añade schemas nuevos (HU-07.1 ya valida el DTO).

## Componentes UI

### Componentes Astro

- `src/components/providers/ServicesSection.astro`:
  - Props: `services: PublicService[]`.
  - Si `services.length === 0` → no renderiza la sección (mockup vacío: ocultar, no placeholder).
  - Si `services.length > 0`:
    - Header con icono `ri-list-check text-primary` y título "Servicios y Precios" (`mockups/profile.html:129-130`).
    - Info-box azul `Precios referenciales. Coordina con el vecino.` (`mockups/profile.html:132-135`).
    - `<ul class="space-y-1">` con un `<li>` por servicio:
      - Nombre a la izquierda (`text-gray-700 font-medium`).
      - Precio a la derecha (`text-primary font-bold`).
      - Borde inferior `border-b border-gray-100` (excepto el último).
      - Línea secundaria con `description` si existe (`text-xs text-gray-400`).
      - Línea de cobertura: chips `inline-flex bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full text-[10px]` con icono `ri-map-pin-line` (mockup `index.html:328-340` para estilo).
- Helper `src/lib/utils/format.ts`:
  - `formatPriceClp(value: number | null): string` — `null → "Consultar"`; número → `new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(value)`.

### Islas requeridas

No (todo SSR).

### Estilos y responsive

- Sección única en `md:col-span-2` (la sidebar de HU-07.2 ocupa `md:col-span-1`).
- Padding `p-5`, rounded `rounded-xl`, sombra `shadow-sm`, borde `border border-gray-100`.
- Chips de cobertura wrapean con `flex flex-wrap gap-1`.

## Flujo de interaccion (secuencial)

1. SSR de `/p/<slug>` carga `PublicProvider` (HU-07.1).
2. `PublicProfile.astro` pasa `provider.services` a `<ServicesSection services={...} />`.
3. `ServicesSection` itera y formatea.
4. HTML resultante se envía al cliente. Sin JS adicional.

## Capa de servicios

No añade servicios. Sólo añade helper de formateo en `src/lib/utils/format.ts`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/format.test.ts` | `formatPriceClp(null) === "Consultar"`, `(0) === "$0"`, `(25000) === "$25.000"`, `(1500000) === "$1.500.000"` |
| Unit | `tests/unit/components/services-section.test.ts` | Renderiza lista ordenada, omite vacíos, muestra cobertura, formato CLP correcto |
| Integración | `tests/integration/providers/services-section.test.ts` | Seed con 3 servicios (activo, inactivo, sin precio) + 1 con 3 comunas; render; verifica orden, inactivo excluido, "Consultar" presente, 3 chips de cobertura |
| E2E | `tests/e2e/profile-services.spec.ts` | Carga perfil, asserts `ul#profile-services-list li` count == 3 |

## Dependencias y secuencia

- **Bloqueado por:** HU-07.1 (DTO). Esta HU también requiere extender `PublicService` con `description` y `coverage` — se hace en este PR.
- **Bloquea a:** ninguna directa. HUs del dashboard prestador (REQ-12) podrían reusar `formatPriceClp`.
- **Recursos compartidos:** `Intl.NumberFormat` (built-in).

## Riesgos tecnicos

- Riesgo: `Intl.NumberFormat('es-CL')` no disponible en runtime edge → Mitigación: Cloudflare Workers lo soporta nativamente (ICU full); tests de integración validan en el runtime real.
- Riesgo: cambios al DTO rompen consumidores existentes (HU-07.2) → Mitigación: los nuevos campos son `description?: string | null` y `coverage: string[]` (default `[]`); no rompen shape anterior porque HU-07.1 se modifica en el mismo PR.
- Riesgo: comuna sin resolver aparece como `slug-xxx` en chips → Mitigación: la query de HU-07.1 hace `INNER JOIN communes ON ...` y devuelve nombre; si no hay match, fallback a slug + warn.
- Riesgo: servicio con `coverage` de 50 comunas satura la UI → Mitigación: máximo 10 comunas visibles + chip "+N más" (decisión fuera de scope; se documenta).
