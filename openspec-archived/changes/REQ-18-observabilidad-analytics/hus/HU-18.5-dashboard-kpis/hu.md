# HU-18.5 — Dashboard de KPIs vs targets OE

**Estado:** implementada-mvp | **Prioridad:** P1 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** admin
**Quiero** ver los KPIs vinculados a OE1/OE2/OE3 con su progreso vs target
**Para** monitorear el cumplimiento de objetivos

## Criterios de aceptación (Gherkin)

### Escenario: Widgets renderizan los 3 OE
  Cuando admin entra a `/dashboard-admin#analytics`
  Entonces ve 4 KPIs: Vistas Perfil (7d), Contactos (7d), Búsquedas (7d), Conversión a Contacto (%)
  Y un gráfico "Actividad por día" (últimos 7 días)
  Y un embudo de conversión: visitantes → vieron perfil → contactaron → dejaron reseña
  Y un ranking "Top oficios buscados (7d)"

> **Nota**: Los 3 OEs (p95 search, precisión search, ratio donaciones) se muestran como sub-widget secundario en cada card OE — ver mockup `mockups/dashboard-admin.html:288-447` para detalle.

### Escenario: Datos en cuasi-tiempo-real (≤5 min)
  Dado eventos recientes
  Cuando se renderiza
  Entonces los widgets reflejan datos de los últimos 5 min

### Escenario: Sin datos → estado vacío legible
  Dado entorno limpio sin eventos
  Cuando se renderiza
  Entonces aparece "Sin datos aún" en lugar de números falsos

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/analytics/kpis.ts` extendido
- [ ] Componente `src/components/admin/AnalyticsDashboard.astro`
- [ ] Tests `tests/integration/admin/analytics-kpis.test.ts`, `tests/e2e/admin-analytics.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
