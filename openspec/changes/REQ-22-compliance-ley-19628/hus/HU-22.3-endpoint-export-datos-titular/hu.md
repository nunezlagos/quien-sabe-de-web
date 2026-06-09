# HU-22.3 — Export de datos del titular en JSON

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-22-compliance-ley-19628

## Historia de usuario

**Como** titular de mis datos
**Quiero** descargar todos mis datos personales
**Para** ejercer mi derecho de acceso (Art. 12 Ley 19.628)

## Criterios de aceptación (Gherkin)

### Escenario: Export devuelve JSON completo
  Dado un user_id=42 con perfil, reseñas dejadas, favoritos, contactos
  Cuando envío `GET /api/v1/users/me/data-export`
  Entonces recibo status 200 con `Content-Type: application/json` y `Content-Disposition: attachment`
  Y el JSON contiene claves: `user`, `provider_profile`, `reviews`, `contacts`, `favorites`, `consents`

### Escenario: Rate limit 1 por día → 429
  Dado un export en las últimas 24h
  Cuando solicito otro
  Entonces recibo status 429

### Escenario: Datos derivados anonimizados
  Cuando reviso el JSON
  Entonces los IDs de otros usuarios no aparecen en texto plano (sólo `provider_public_slug` para favoritos)

### Escenario: Acceso registrado en data_access_log
  Cuando el export se sirve
  Entonces se inserta fila en `data_access_log` con `actor=self`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/data-export.ts`
- [ ] Servicio `src/lib/services/compliance/export.ts` con queries Drizzle por tabla
- [ ] Rate-limit clave `data_export:<user_id>` TTL 86400
- [ ] Tests `tests/integration/compliance/export.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
