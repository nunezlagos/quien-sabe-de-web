# Diseno tecnico — HU-17.4 — Templates de verificación aprobada/rechazada

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

No se introducen tablas. La fila de `email_log` la crea HU-17.2.

## Contrato de API

No se exponen endpoints nuevos. Los triggers son internos: la transición de
estado de verificación (REQ-03) llama `EmailService.send`.

## Validaciones Zod

```ts
// src/lib/validators/email-templates.ts (ampliar)
export const verificationApprovedVarsSchema = z.object({
  name: z.string().min(1).max(80),
  profileUrl: z.string().url(),
});

export const verificationRejectedVarsSchema = z.object({
  name: z.string().min(1).max(80),
  reason: z.string().min(1).max(500),
  reapplyUrl: z.string().url(),
});
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. Admin hace `POST /api/v1/admin/verifications/:id/approve` (REQ-03).
2. Handler llama `verificationTransitions.approve({ providerId, adminId, db, emailService })`.
3. Transición actualiza estado y, si cambió a `approved`, llama
   `emailService.send({ template:'verification_approved', to: provider.email, vars:{ name, profileUrl }, relatedEntity:`provider:${providerId}` })`.
4. Análogamente, el path `reject({ reason })` llama `template:'verification_rejected'` con `reason`.
5. `EmailService.send` valida, render, adapter.send, logEmail.
6. Si email falla, transición ya commiteada; log lo registra.

## Capa de servicios

```
src/lib/services/email/templates/
  verification_approved.html.ts
  verification_approved.txt.ts
  verification_rejected.html.ts
  verification_rejected.txt.ts
```

Registry actualizado:
```ts
export const templates = {
  welcome: { ... },
  verification_approved: { html, text, varsSchema: verificationApprovedVarsSchema },
  verification_rejected: { html, text, varsSchema: verificationRejectedVarsSchema },
};
```

En `src/lib/services/verification/transitions.ts` (de REQ-03):
- `approve(...)` → emailService.send(`verification_approved`).
- `reject(...)` → emailService.send(`verification_rejected`).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/email/templates/verification-approved.test.ts` | render con vars normales; varsSchema rechaza faltante |
| Unit | `tests/unit/email/templates/verification-rejected.test.ts` | render incluye `reason` escapado; varsSchema limita reason a 500 chars |
| Integracion | `tests/integration/email/verification.test.ts` | mock `emailService` con spy; llamar `transitions.approve(...)` resulta en 1 send con `template:'verification_approved'`; análogo para `reject` con `reason` correcto |

## Dependencias y secuencia

- **Bloqueado por:** HU-17.1, HU-17.2, HU-17.3 (registry, render). REQ-03.5 (transición de estado).
- **Bloquea a:** ninguno.
- **Recursos compartidos:** `src/lib/services/email/templates/index.ts`, `src/lib/services/verification/transitions.ts`.

## Riesgos tecnicos

- Riesgo: el template se olvida de escapar `reason` → Mitigación: test unitario con `reason="<script>..."` y assert de escape; auditoría visual.
- Riesgo: la transición de estado no recibe `emailService` por DI → Mitigación: en T2 se valida que `transitions.approve` y `reject` acepten `emailService` como parámetro; si REQ-03.5 no lo soporta aún, agregar el parámetro en una sub-tarea de coordinación.
- Riesgo: el `relatedEntity` se construye mal → Mitigación: helper `providerEntity(id)` centralizado; test verifica string exacto.
