# Diseño técnico — HU-21.5 — Banner verificación pendiente en dashboard prestador

**REQ padre:** REQ-21-onboarding-prestador

## Modelo de datos

No introduce tablas. Lee `providers.status` (existente desde REQ-04) y, para la variante `rejected`, opcionalmente `providers.rejection_reason` (futuro REQ-03).

## Contrato de API

No aplica. Esta HU es UI pura; consume datos del SSR de `/dashboard-provider` (REQ-12).

## Validaciones Zod

No aplica.

## Componentes UI

### Componente Astro
- `src/components/banners/ProviderStatusBanner.astro` — props: `{ status: 'pending_verification' | 'approved' | 'rejected', rejectionReason?: string }`.
  - Si `status === 'approved'` → retorna `null` (no renderiza nada).
  - Si `status === 'pending_verification'` → banner amarillo:
    ```astro
    <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3 mb-6" role="status">
      <i class="ri-time-line text-yellow-600 text-2xl"></i>
      <div class="flex-1">
        <h3 class="font-bold text-yellow-800 text-sm">Tu perfil está en revisión</h3>
        <p class="text-yellow-700 text-xs mt-1">Nuestro equipo está verificando tu certificado. Esto suele tardar 24-48 horas.</p>
        <a href="/verification" class="inline-block mt-3 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">Ir a verificación</a>
      </div>
    </div>
    ```
  - Si `status === 'rejected'` → banner rojo:
    ```astro
    <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6" role="alert">
      <i class="ri-error-warning-line text-red-600 text-2xl"></i>
      <div class="flex-1">
        <h3 class="font-bold text-red-800 text-sm">Perfil rechazado</h3>
        <p class="text-red-700 text-xs mt-1">{rejectionReason ?? 'Tu certificado no cumple los requisitos.'}</p>
        <a href="/verification" class="inline-block mt-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">Reintentar</a>
      </div>
    </div>
    ```

### Integración en `dashboard-provider.astro`
- Insertar arriba del card "Editar Perfil" (`mockups/dashboard-provider.html:125`), después del bloque de estadísticas (`mockups/dashboard-provider.html:78-95`).
- Query: `const provider = await getProviderByUserId(env, session.userId)` (helper existente REQ-12).
- Render: `<ProviderStatusBanner status={provider.status} rejectionReason={provider.rejectionReason} />` envuelto en una condición `{provider && <ProviderStatusBanner ... />}`.

## Flujo de interacción (secuencial)

1. Prestador autenticado navega a `/dashboard-provider`.
2. SSR consulta `providers` por `user_id`.
3. Renderiza layout base del dashboard (sidebar + main column).
4. Si `provider.status !== 'approved'`, renderiza `<ProviderStatusBanner>` arriba del card "Editar Perfil".
5. Si `status === 'pending'`, banner amarillo con CTA "Ir a verificación" (`href="/verification"`).
6. Si `status === 'rejected'`, banner rojo con motivo + CTA "Reintentar" (`href="/verification"`).
7. Tras refresh manual o nueva visita, si el estado cambió a `approved`, el banner desaparece.

## Capa de servicios

Reutiliza `getProviderByUserId(env, userId)` de REQ-12. Esta HU no introduce servicios nuevos.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/components/provider-status-banner.test.ts` (snapshots) — variantes pending/rejected renderizan markup correcto; approved retorna `null`. |
| Integración | `tests/integration/dashboard/provider-banner.test.ts` — SSR con fixture `status=pending_verification` → HTML contiene banner amarillo; fixture `status=approved` → HTML NO contiene banner; fixture `status=rejected` con motivo → banner rojo con el motivo. |
| E2E | `tests/e2e/dashboard-provider-status.spec.ts` — login prestador pendiente → ve banner; login prestador aprobado → NO ve banner; login prestador rechazado → ve banner rojo con motivo. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-04 (tabla `providers` con columna `status`), REQ-12 (dashboard renderiza `provider`), HU-21.3 (endpoint que setea `status="pending_verification"`).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** `src/components/banners/`, `src/database/schema.ts` (tabla `providers`).

## Riesgos técnicos

- Riesgo: `role="status"` vs `role="alert"` semánticamente diferentes → Mitigación: pending usa `role="status"` (informativo), rejected usa `role="alert"` (urgente). Documentado.
- Riesgo: si `rejection_reason` es null en DB, el banner rejected muestra texto genérico → Mitigación: fallback `"Tu certificado no cumple los requisitos."` en el componente.
- Riesgo: el CTA "Ir a verificación" rompe si el usuario ya completó el flujo → Mitigación: la página `/verification` (REQ-03) debe manejar el caso "ya está aprobado" mostrando un mensaje informativo; fuera del scope de esta HU.