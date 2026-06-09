# HU-21.3 — Endpoint crear perfil PRO desde wizard

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** vecino que completa el wizard
**Quiero** persistir mi perfil profesional al hacer submit
**Para** entrar al flujo de verificación

## Criterios de aceptación (Gherkin)

### Escenario: Submit válido crea perfil pending_verification
  Cuando envío `POST /api/v1/providers/me` con `{"display_name":"Juan P.","trade_id":1,"bio":"Gasfiter...","whatsapp":"+56912345678","base_price_clp":15000,"commune_ids":[1,2,3]}`
  Entonces recibo status 201 con `{ "id": ..., "status": "pending_verification" }`
  Y existen filas en `providers` y `provider_communes`

### Escenario: WhatsApp normalizado
  Cuando envío `{"whatsapp":"912345678"}`
  Entonces se persiste como `+56912345678`

### Escenario: Bio > 500 chars → 422
  Cuando envío bio de 600 caracteres
  Entonces recibo status 422

### Escenario: Sin verificar email → 403
  Cuando user sin verificar (REQ-20) envía POST
  Entonces recibo status 403 con `{ "error": "email no verificado" }`

## Tareas técnicas

- [ ] Extender Zod schema `ProviderCreate` en `src/lib/validators/providers.ts` con `display_name`, `bio`, `whatsapp`, `base_price_clp`, `commune_ids`
- [ ] Helper `normalizeWhatsapp(raw)` en `src/lib/utils/phone.ts` (regex chileno)
- [ ] Update endpoint `src/pages/api/v1/providers/me/index.ts` (POST)
- [ ] Transacción D1 para crear `providers` + `provider_communes` atómicamente
- [ ] Tests `tests/unit/utils/phone.test.ts`, `tests/integration/providers/wizard-create.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
