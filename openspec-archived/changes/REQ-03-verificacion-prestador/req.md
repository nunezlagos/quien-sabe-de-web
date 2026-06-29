# REQ-03-verificacion-prestador

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Flujo de verificación de identidad del prestador: captura RUT chileno, sube
documentos respaldatorios (cédula, certificado SEC, antecedentes) a R2/MinIO,
cola de revisión admin con estados (pendiente / verificado / rechazado).
Sin verificación aprobada el perfil no aparece en búsqueda pública.

## Criterios de éxito

- [ ] RUT validado con dígito verificador antes de aceptar el form.
- [ ] Documentos suben directamente a R2/MinIO con presigned URL.
- [ ] Admin recibe la solicitud en cola con preview de documentos.
- [ ] Cambio de estado emite email transaccional al prestador.
- [ ] Perfil verificado expone badge en vista pública.
- [ ] Perfil rechazado puede re-enviar con corrección.

## Superficie técnica

### Endpoints API
- `POST  /api/v1/providers/me/verification` — inicia solicitud [sesión prestador]
- `POST  /api/v1/providers/me/verification/documents` — presigned URL para R2 [sesión prestador]
- `GET   /api/v1/providers/me/verification` — estado actual [sesión prestador]
- `GET   /api/v1/admin/verifications` — cola admin [admin]
- `PATCH /api/v1/admin/verifications/:id` — aprobar/rechazar [admin]

### Vistas Astro
- `/verification` — formulario prestador
- `/dashboard-admin#verifications` — cola admin

### Tablas Drizzle
- `provider_verifications` (id, user_id, rut, status, reviewed_by, reviewed_at)
- `verification_documents` (id, verification_id, r2_key, kind, uploaded_at)

### Bindings Cloudflare
- `D1`, `R2` (bucket `documents`), `SES` (transaccional)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-03.1 | validador-rut-chileno | Función pura + validador Zod | P0 |
| HU-03.2 | form-verificacion-rut | UI del formulario en `/verification` | P0 |
| HU-03.3 | upload-documentos-r2 | Presigned upload a R2/MinIO | P0 |
| HU-03.4 | cola-admin-verificacion | Listado y preview en dashboard-admin | P0 |
| HU-03.5 | transiciones-estado | Aprobar/rechazar + auditoría | P0 |
| HU-03.6 | badge-verificado | Mostrar badge en perfiles aprobados | P1 |

## Tests requeridos

- **Unit:** validador RUT (casos: con/sin puntos, con/sin guión, K mayúscula/minúscula, DV inválido, formato basura).
- **Integración:** flujo presigned URL → upload simulado → registro DB; transiciones de estado idempotentes; admin sin permisos → 403.
- **E2E:** prestador completa form + sube doc → admin aprueba → prestador ve badge en su perfil.

## Dependencias

- **Depende de:** REQ-01, REQ-17 (email)
- **Habilita a:** REQ-04 (perfil sólo público si verificado), REQ-13 (cola admin)

## Riesgos / suposiciones

- Verificación manual escala mal: a 100 prestadores se evalúa Truora/Jumio (suposición §3.4.5).
- Documentos sensibles: encriptación at-rest en R2 (default), retención según política legal.
- Plazo SLA inicial: 48h hábiles.
