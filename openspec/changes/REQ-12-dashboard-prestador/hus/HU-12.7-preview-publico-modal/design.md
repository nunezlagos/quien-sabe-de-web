# Diseño técnico — HU-12.7 — Preview público en modal iframe

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

No introduce tablas. Sólo afecta a la lógica de conteo en `profile_views` para excluir `preview=true`.

(No requiere migración Drizzle propia.)

## Contrato de API

Esta HU no introduce endpoints. Reusa la ruta pública `/p/[slug]` con query `?preview=true` (REQ-04.4) y la lógica de exclusión de vistas se aplica en el handler del registro de vista.

## Validaciones Zod

```ts
// src/lib/validators/preview.ts (pseudocódigo)
export const previewQuerySchema = z.object({
  preview: z.literal('true').optional(),
})
```

## Componentes UI

### Páginas Astro

- Sin página nueva. La ruta pública `src/pages/p/[slug].astro` (REQ-04.4) recibe el query `?preview=true` y omite el registro de vista cuando proviene del propio prestador.

### Componentes Astro reutilizables

- `src/components/dashboard/provider/PreviewModal.astro` — props: `slug: string`.
  - Renderiza el contenedor `<div id="preview-modal">` con header (badge + cerrar) y `<iframe>` apuntando a `/p/${slug}?preview=true`.
  - Mockup base: `mockups/dashboard-provider.html:443-468`.
  - Islas requeridas: sí (`client:visible`) para abrir/cerrar y forzar `iframe.src = iframe.src` en cada apertura.
- `src/components/dashboard/provider/PreviewButton.astro` — props: `slug: string`. Renderiza el botón disparador.
  - Mockup base: `mockups/dashboard-provider.html:71-75`.

## Flujo de interacción (secuencial)

1. Usuario hace click en "Previsualizar Perfil Público" (`mockups/dashboard-provider.html:71-75`).
2. La isla añade `document.body.style.overflow = 'hidden'` y muestra el modal con transición (`mockups/dashboard-provider.html:513-531`).
3. La isla asigna `iframe.src = iframe.src` para forzar recarga (`mockups/dashboard-provider.html:550-553`).
4. El iframe solicita `/p/${slug}?preview=true`. Servidor renderiza la vista pública.
5. El handler que registra `profile_views` detecta `preview=true` y la sesión del prestador propietario; **no** inserta la vista.
6. Usuario cierra el modal (`mockups/dashboard-provider.html:457-460`) o click en backdrop (`mockups/dashboard-provider.html:558`).
7. Isla restaura `document.body.style.overflow = ''`; el scroll del dashboard permanece intacto.

## Capa de servicios

- `src/lib/services/profile-views.service.ts` (existente en REQ-04 o creado aquí):
  - `recordView(env, providerId, request): Promise<void>` — debe contener la guarda:
    - Si `URL.searchParams.get('preview') === 'true'` y sesión actual pertenece al `provider_id` del slug → return sin insertar.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/profile-views-preview.test.ts` | `recordView` ignora preview del propio prestador y registra preview de un tercero (paranoia). |
| Integración | `tests/integration/preview/no-view-counted.test.ts` | `GET /p/:slug?preview=true` con sesión del owner no incrementa contador; sin sesión sí (o se ignora según política definitiva). |
| E2E | `tests/e2e/provider-preview-modal.spec.ts` | Abrir modal → ver iframe cargado → cerrar → scroll preservado. Editar biografía → reabrir → ver cambio. |

## Dependencias y secuencia

- **Bloqueado por:** HU-12.1, HU-12.3 (necesaria para validar que los cambios se reflejen), REQ-04.4 (vista pública `/p/[slug]` con flag `preview`).
- **Bloquea a:** —.
- **Recursos compartidos:** ruta pública `/p/[slug]`, sesión del prestador, tabla `profile_views`.

## Riesgos técnicos

- Riesgo: el iframe queda con caché del browser y no refleja cambios. Mitigación: reasignación de `src` al abrir (`mockups/dashboard-provider.html:551-553`) + `Cache-Control: no-store` en la vista pública cuando `preview=true`.
- Riesgo: focus trap en el modal no implementado, atrapando teclado fuera. Mitigación: añadir trap básico en la isla (out of scope si la isla compartida ya lo maneja en otros modales).
- Riesgo: pérdida del flag `preview=true` al navegar dentro del iframe. Mitigación: la vista pública preserva el query al generar links internos o se deshabilita la navegación dentro del iframe (atributo `sandbox`).
