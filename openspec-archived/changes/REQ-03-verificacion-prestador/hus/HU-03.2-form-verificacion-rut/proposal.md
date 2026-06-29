# Propuesta — HU-03.2 — Formulario de verificación de prestador

**Estado:** propuesta | **REQ padre:** REQ-03-verificacion-prestador

## Contexto

Una vez que el prestador decide iniciar su verificación, necesita un formulario que capture su RUT y abra una solicitud en la cola admin. Esta HU implementa el endpoint `POST /api/v1/providers/me/verification` (con `GET` para estado), valida el RUT con HU-03.1, y persiste una fila en `provider_verifications` con `status="pendiente"`. La vista `/verification` ya existe como mockup; esta HU la conecta con backend.

## Mockups de referencia

- `mockups/verification.html:84-100` — campo RUT + select de oficio principal. La vista se construye en `src/pages/verification.astro` siguiendo este layout (form card con RUT + oficio + uploads + checkbox de declaración + botón "Enviar Solicitud").

## Alternativas consideradas

### Opcion A — Una solicitud activa a la vez; reenvío crea fila nueva si anterior rechazada
- Constraint en DB: UNIQUE(provider_user_id, status='pendiente') vía índice parcial (o validado en servicio).
- POST con solicitud pendiente → 409.
- POST con solicitud rechazada → crea fila nueva (el historial se conserva).
- Pro: historial auditable.
- Contra: requiere query previa para chequear estado actual.

### Opcion B — Upsert sobre la misma fila, perdiendo historial
- Contra: pierde trazabilidad; admins no pueden ver por qué se rechazó antes.

### Opcion C — Sin constraint, permitir múltiples pendientes
- Contra: el admin ve duplicados en la cola.

## Decision

Se elige **Opcion A**. El historial de solicitudes es crítico para auditoría (REQ-03 menciona explícitamente que un rechazo permite re-enviar). La constraint se valida en servicio (`SELECT WHERE status='pendiente'` antes de insert) y, defensivamente, con índice único parcial `UNIQUE(provider_user_id) WHERE status='pendiente'` si SQLite/D1 lo soporta.

## Riesgos y mitigaciones

- Riesgo: race condition entre check y insert → Mitigación: el índice único parcial captura la condición; el insert que viola el UNIQUE → error → 409.
- Riesgo: RUT duplicado entre prestadores distintos → Mitigación: el modelo permite que dos prestadores tengan el mismo RUT (empresa con varios representantes); la unicidad es por `user_id`, no por `rut`.
- Riesgo: GET `/verification` expone `rut` sin máscara → Mitigación: GET devuelve `rut_masked` (`12.***.*5`); el RUT completo solo en POST inicial y en endpoints admin (HU-03.4 con auth admin).

## Metrica de exito

- POST con RUT válido y sin solicitud pendiente → 201, fila en `provider_verifications` con `status="pendiente"`.
- POST con solicitud pendiente existente → 409 `verificación ya en curso`.
- POST con solicitud rechazada previa → 201, nueva fila.
- GET devuelve `{ status, created_at, reviewed_at, rejection_reason? }` con `rut_masked` siempre.
- RUT inválido → 422 con detalle del campo.
- Tests unit + integración + E2E verde; coverage ≥ 90%.
