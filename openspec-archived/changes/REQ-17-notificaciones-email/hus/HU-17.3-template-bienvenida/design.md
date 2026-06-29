# Diseno tecnico — HU-17.3 — Template de bienvenida

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

No se introducen tablas. La fila de `email_log` la crea HU-17.2 al enviar.

## Contrato de API

No se exponen endpoints nuevos. El trigger es interno: `POST
/api/v1/auth/register` (de REQ-01) llama a `EmailService.send({ template:
'welcome', ... })` después de crear el usuario.

## Validaciones Zod

```ts
// src/lib/validators/email-templates.ts (firmas)
import { z } from 'zod';

export const welcomeVarsSchema = z.object({
  name: z.string().min(1).max(80),
  role: z.enum(['user', 'provider', 'admin']).default('user'),
  loginUrl: z.string().url(),
});
```

El render valida `vars` con Zod antes de componer el mensaje; si falla,
lanza `TemplateValidationError` y no se envía.

## Componentes UI

No aplica (es backend).

## Flujo de interaccion (secuencial)

1. `POST /api/v1/auth/register` crea `users` row.
2. Handler llama `EmailService.send({ template:'welcome', to: user.email, vars:{ name, role, loginUrl }, relatedEntity:`user:${user.id}` })`.
3. `EmailService.send` (HU-17.1/17.2) llama `renderTemplate('welcome', vars)`.
4. `renderTemplate` valida con Zod, despacha a `welcome.html.ts` y
   `welcome.txt.ts` (registrados en un map).
5. Helper `escapeHtml` aplica a toda interpolación de `welcome.html.ts`.
6. `EmailMessage` se compone con `html` y `text`; se pasa al adapter.
7. Adapter envía; `logEmail` registra fila.

## Capa de servicios

```
src/lib/services/email/templates/
  index.ts              ← registry: { welcome: { html, text } }
  escape.ts             ← escapeHtml(str)
  welcome.html.ts       ← export function render(vars: WelcomeVars): string
  welcome.txt.ts        ← export function render(vars: WelcomeVars): string
```

```ts
// src/lib/services/email/render.ts (firmas)
export type TemplateRender = (vars: Record<string, unknown>) => { html: string; text: string };

export const templates: Record<string, { html: TemplateRender; text: TemplateRender; varsSchema: z.ZodTypeAny }> = {
  welcome: {
    html: (v) => welcomeHtml.render(v as WelcomeVars),
    text: (v) => welcomeTxt.render(v as WelcomeVars),
    varsSchema: welcomeVarsSchema,
  },
  // HU-17.4+ agregan más
};

export function renderTemplate(
  name: string,
  vars: Record<string, unknown>,
): { html: string; text: string };
```

`escapeHtml(s)` mapea `&<>"'` a entidades; usado dentro de los HTML templates.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/email/templates/welcome.test.ts` | render con name normal; render con name que contiene `<script>`; render con role `provider` cambia copy; vars faltantes → Zod falla |
| Unit | `tests/unit/email/escape.test.ts` | `escapeHtml` cubre `&`, `<`, `>`, `"`, `'`; idempotente |
| Unit | `tests/unit/email/render.test.ts` | `renderTemplate('welcome', vars)` retorna `{ html, text }`; template inexistente lanza |
| Integracion | `tests/integration/email/welcome-flow.test.ts` | end-to-end: mock `EmailService.send` con `template:'welcome'` → resultado contiene `Content-Type` correcto y ambas variantes |

## Dependencias y secuencia

- **Bloqueado por:** HU-17.1 (interfaz adapter), HU-17.2 (log).
- **Bloquea a:** ninguno directo; cualquier flujo que envíe `welcome` (REQ-01 registro).
- **Recursos compartidos:** `src/lib/services/email/EmailService.ts`, `src/lib/services/email/render.ts`.

## Riesgos tecnicos

- Riesgo: copy cambia a una versión larga y el email rebota por tamaño → Mitigación: el límite de Zod (`max(80)` en `name`) más disciplina editorial.
- Riesgo: el template olvida escapar una variable nueva → Mitigación: el helper `escapeHtml` es el único punto de escape; auditoría visual + tests con strings XSS.
- Riesgo: el email se envía con `from` no configurado → Mitigación: el adapter usa `env.DEFAULT_FROM` con fallback; verificar en T1.
