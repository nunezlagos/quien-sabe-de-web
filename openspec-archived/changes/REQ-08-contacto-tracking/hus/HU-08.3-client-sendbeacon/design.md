# Diseno tecnico — HU-08.3 — Botones de contacto wireados con sendBeacon

**REQ padre:** REQ-08-contacto-tracking

## Modelo de datos

No aplica. Esta HU es cliente puro; consume el endpoint de HU-08.2.

## Contrato de API

Cliente del endpoint definido en HU-08.2:

| Endpoint | Metodo | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/contacts/track` | POST (vía sendBeacon) | público | `{ "provider_id": number, "kind": "whatsapp" \| "phone" \| "email" }` | 204 (ignorado por el cliente) | El cliente no consume errores; navega igual |

## Validaciones Zod

No aplica en cliente. La validación canónica vive en el endpoint (HU-08.2). En cliente se hace mínimo chequeo de tipos antes de serializar:
- `providerId` debe ser número entero positivo.
- `kind` debe ser uno de `whatsapp|phone|email`.

## Componentes UI

### Paginas Astro
- No introduce páginas nuevas. Se integra en `src/pages/p/[slug].astro` y `src/pages/index.astro` (de REQs paralelos) a través del componente compartido descrito abajo.

### Componentes Astro reutilizables
- `src/components/providers/ContactButtons.astro` — render de los CTAs WhatsApp/email/phone con atributos `data-*` para que el script cliente los enganche.
  - Props (pseudocodigo):
    - `providerId: number`
    - `whatsapp?: string` (número internacional sin `+`, ej. `56912345678`)
    - `email?: string | null`
    - `phone?: string | null`
    - `variant: 'profile' | 'card-grid' | 'card-list'`
  - Mockup base:
    - Variante `profile` → `mockups/profile.html:92-103`.
    - Variante `card-grid` → `mockups/index.html:369-371`.
    - Variante `card-list` → `mockups/index.html:416-422`.
  - Islas requeridas: no. Render server-side; el script de tracking se carga global vía layout.

### Atributos de marcado emitidos

| Atributo | Ejemplo | Uso |
|---|---|---|
| `data-track-kind` | `"whatsapp"` \| `"phone"` \| `"email"` | indica `kind` a enviar |
| `data-provider-id` | `"42"` | `provider_id` del payload |
| `data-href` | `"https://wa.me/56912345678"` | URL final (también va en `href`) |

## Flujo de interaccion (secuencial)

1. Usuario carga `/p/:slug` (perfil público). Astro renderiza `ContactButtons` con `data-*`.
2. El layout incluye `<script src="/scripts/track-contact.js">` que se autoinstala en `DOMContentLoaded`.
3. El script busca `document.querySelectorAll('[data-track-kind]')` y agrega listener `click` y `auxclick`.
4. Usuario hace click en `#profile-whatsapp-btn` (`mockups/profile.html:93`).
5. El listener lee `data-track-kind` y `data-provider-id`, construye el payload JSON.
6. Llama `navigator.sendBeacon('/api/v1/contacts/track', new Blob([json], { type: 'application/json' }))`.
7. No invoca `preventDefault`. El navegador procede con la navegación al `href` (`wa.me/...`).
8. Servidor (HU-08.2) procesa async y responde 204; el cliente lo ignora.

## Capa de servicios

- `src/lib/client/track-contact.ts` — cliente browser-only. Métodos (firmas en pseudocodigo):
  - `trackContact(payload: { providerId: number, kind: 'whatsapp' | 'phone' | 'email' }): boolean` — wrapper de `sendBeacon` con feature-detect.
  - `installContactTrackingListeners(root?: ParentNode): void` — engancha listeners sobre `[data-track-kind]`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/client/track-contact.test.ts` | Wrapper invoca `sendBeacon` con payload correcto; fallback cuando no existe |
| E2E | `tests/e2e/contact-tracking.spec.ts` | Clic WhatsApp dispara POST + abre `wa.me`; clic email dispara POST + abre `mailto:`; tracking 500 no bloquea redirect |

## Dependencias y secuencia

- **Bloqueado por:** HU-08.2 (endpoint debe existir para que sendBeacon tenga destino).
- **Bloquea a:** ninguna directamente; habilita medición real de OE2.
- **Recursos compartidos:**
  - Mockups de cards y perfil que serán portados a `src/pages/p/[slug].astro` y `src/pages/index.astro` en REQs paralelos.
  - Layout global (`src/layouts/`) que monta el script.

## Riesgos tecnicos

- Riesgo: `sendBeacon` retorna `false` si la cola está llena → Mitigación: registrar `console.warn` y continuar; el redirect debe ocurrir.
- Riesgo: usuario con extensión bloquea beacons → Mitigación: aceptamos pérdida; documentar que la métrica es best-effort.
- Riesgo: doble disparo si el botón está dentro de un `<a>` con handler propio → Mitigación: usar listener único delegado a nivel `document` con guard `dataset.tracked`.
- Riesgo: SSR enviar `data-href` con caracteres no escapados → Mitigación: el rendering de Astro escapa por defecto; validar con tests E2E.
- Riesgo: en SSR durante build, el script intenta correr → Mitigación: guard `if (typeof window !== 'undefined')` en el módulo.
