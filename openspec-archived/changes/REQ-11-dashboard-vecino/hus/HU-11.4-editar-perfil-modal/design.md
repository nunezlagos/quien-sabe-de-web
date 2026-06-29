# Diseno tecnico — HU-11.4 — Modal de edición de perfil del vecino

**REQ padre:** REQ-11-dashboard-vecino

## Modelo de datos

No aplica. Esta HU no introduce tablas. Lee `users`, `communes` (REQ-02) y reusa el endpoint `PATCH /api/v1/users/me/profile`.

## Contrato de API

### Reuso de `PATCH /api/v1/users/me/profile` (REQ-02)

- **Auth:** sesión de vecino.
- **Body:**
  ```json
  {
    "commune_id": 13123,
    "notify_email": true,
    "interests": ["gasfiter", "electricista"]
  }
  ```
- **Response 200:** `{ ok: true, user: { id, email, commune_id, notify_email, interests } }`
- **Response 422:** body con campos inválidos (Zod errors).

### `GET /api/v1/communes` (público, REQ-02)

- Devuelve el catálogo de comunas RM para popular el `<select>` del modal.

## Validaciones Zod

```ts
// src/lib/validators/edit-profile-modal.ts (cliente, espejo del server)
import { z } from 'zod'

export const editProfileSchema = z.object({
  commune_id: z.number().int().positive(),
  notify_email: z.boolean(),
  interests: z.array(z.string().min(1).max(40)).max(10),
})

export const emailSchema = z.string().email().optional().or(z.literal(''))
```

El server ya valida con el schema de REQ-02; el cliente re-valida para feedback inmediato.

## Componentes UI

- `src/components/dashboard/user/EditProfileModal.astro` — modal overlay (backdrop `bg-black/50`, card `bg-white rounded-3xl`, header gris). Acepta props `{ user: User, communes: Commune[] }`. Renderiza form con:
  - Select comuna (poblado con `communes`).
  - Checkbox "Recibir notificaciones por email".
  - Chips de intereses (reuso del componente de REQ-02 si existe, o implementación mínima).
  - Botón "Guardar" y "Cancelar".
- `src/components/dashboard/user/EditProfileButton.astro` — botón `ri-edit-line` del header que abre el modal por ID (mismo patrón que `mockups/dashboard-user.html:30-32`).
- Script ligero en el mismo `.astro` (`<script>` con `is:inline` o módulo) para: toggle del modal, ESC, click en backdrop, focus trap básico.

Estilo: replica `mockups/dashboard-user.html:148-189`. La grilla de 2 columnas del mockup (nombre/apellido) NO se replica — esos campos no son editables (REQ-02 los fija en onboarding).

## Flujo de interaccion (secuencial)

1. Vecino en `/dashboard-user` → ve el header con su comuna actual.
2. Click en `EditProfileButton` → JS remueve clase `hidden` del modal, foco al primer input.
3. Modal muestra: `commune_id` preseleccionado, `notify_email` checked según estado actual, `interests` como chips activos.
4. Vecino cambia comuna a "Maipú" y desmarca `notify_email`. Submit.
5. Cliente valida con `editProfileSchema` (sin esperar al server). Si falla → muestra error inline. Si pasa → `fetch('/api/v1/users/me/profile', { method: 'PATCH', body: JSON.stringify(payload) })`.
6. Server responde 200 → cliente cierra modal (`hidden`), `location.reload()` para refrescar el header con la nueva comuna.
7. Server responde 422 → cliente muestra los errores por campo (mapeo desde `error.issues`).

## Capa de servicios

No agregamos servicios nuevos. El handler de PATCH vive en REQ-02; HU-11.4 sólo lo invoca desde el cliente.

Reuso:
- `src/lib/services/users/updateProfile.ts` (REQ-02) — invocado por el endpoint.
- `src/lib/services/communes/listCommunes.ts` (REQ-02) — para popular el select.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/edit-profile-modal/validate.test.ts` | Email regex, commune_id positivo, interests max 10 |
| Integracion | `tests/integration/edit-profile-modal/patch.test.ts` | Vecino actualiza comuna → 200 → DB persiste; commune_id inexistente → 422 |
| E2E | `tests/e2e/edit-profile-vecino.spec.ts` | Abrir modal, cargar valores, validación inline, guardar y refrescar |

## Dependencias y secuencia

- **Bloqueado por:** REQ-02 (endpoint PATCH + endpoint communes + tabla communes), HU-11.1 (header donde va el botón).
- **Bloquea a:** —.
- **Recursos compartidos:** `src/pages/api/v1/users/me/profile.ts`, `src/components/dashboard/user/Layout.astro`.

## Riesgos tecnicos

- Riesgo: el modal queda abierto tras error de red → Mitigación: el botón "Guardar" se deshabilita durante el fetch y vuelve a habilitarse en `finally`.
- Riesgo: el JS inline rompe con CSP estricta → Mitigación: usar `<script>` con `type="module"` y moverlo a bundle; documentar la regla CSP en `AGENTS.md`.
- Riesgo: el `location.reload()` parpadea → Mitigación: aceptable para P1; alternativa (re-fetch del header vía fetch + replaceChildren) queda para optimización futura.
