# Índice de REQs — quien-sabe-de-web

| # | Slug | Foco | OE | Depende de |
|---|------|------|----|------------|
| 01 | autenticacion-sesiones | Login (email + OAuth Google/Facebook), sesión KV, logout, middleware | OE1 | — |
| 02 | onboarding-vecino | Registro y perfil base del rol vecino | OE1 | 01 |
| 03 | verificacion-prestador | RUT + documentos a R2, cola admin, estados | OE1 | 01 |
| 04 | perfil-prestador | CRUD perfil prestador, foto + cover en R2 | OE1 | 01, 03 |
| 05 | catalogo-servicios | CRUD de servicios del prestador (tarifa, unidad) | OE1 | 04 |
| 06 | buscador-discovery | Búsqueda + filtros combinables + paginación + vistas | OE2 | 04, 05 |
| 07 | perfil-publico | Vista pública del prestador con servicios y reseñas | OE2 | 04, 05, 09 |
| 08 | contacto-tracking | Botones WhatsApp/email + evento "contacto efectivo" | OE2 | 07 |
| 09 | resenas-rating | Reseñas (1-5) + promedio público + moderación | OE1, OE2 | 07, 08 |
| 10 | reportes-tickets | Reporte de vecino → cola admin con transiciones | OE1 | 07 |
| 11 | dashboard-vecino | Panel del vecino (historial, perfil, reseñas dejadas) | OE1 | 02, 08, 09, 28 |
| 12 | dashboard-prestador | Panel del prestador (métricas, perfil, servicios, reseñas) | OE1 | 04, 05, 09 |
| 13 | dashboard-admin | Panel admin (usuarios, oficios, finanzas, settings) | OE1, OE3 | 01, 03, 10 |
| 14 | donaciones-pagos | Mercado Pago + Webpay + recibo email + ratio | OE3 | 01, 17 |
| 15 | transparencia-publica | `/transparency` con ingresos, gastos, reportes mensuales | OE3 | 13, 14 |
| 16 | paginas-estaticas | About, Términos, Privacidad (Ley 19.628), FAQ | OE1 | — |
| 17 | notificaciones-email | Emails transaccionales SES/Mailpit + templates | OE1 | 01 |
| 18 | observabilidad-analytics | Eventos clave + dashboard KPIs vinculado a OEs | OE1, OE2, OE3 | 13 |
| 19 | recuperacion-password | Forgot/reset password con invalidación de sesiones | OE1 | 01, 17 |
| 20 | verificacion-email-post-registro | Token de verificación + gate de acciones críticas | OE1 | 01, 02, 17 |
| 21 | onboarding-prestador | Wizard `create-trade` + cobertura multi-comuna | OE1 | 01, 02, 03, 04 |
| 22 | compliance-ley-19628 | Cookie banner, export, delete, consent, audit log | OE1 | 01, 02, 09, 16 |
| 23 | portfolio-prestador | Galería hasta 5 fotos en R2 (dashboard + público) | OE1 | 04 |
| 24 | disponibilidad-horaria-prestador | Horario semanal + badge "Disponible ahora" + filtro | OE1 | 04 |
| 25 | healthcheck-uptime | `/health` + `/ready` + UptimeRobot | OE1 | — |
| 26 | ci-cd-pipeline | GitHub Actions (PR, E2E, staging, prod, cron) | OE1 | 15, 25 |
| 27 | multi-rol-cuenta | Usuario con múltiples roles simultáneos | OE1 | 01, 21 |
| 28 | actividad-vecino-favoritos | Favoritos + historial reciente en dashboard vecino | OE2 | 02, 04, 07 |

## Lectura del mapa de dependencias

**Raíz (sin dependencias):** REQ-01, REQ-16, REQ-25.

**Núcleo del producto (mes 1-4, OE1):** 01 → 02, 03 → 04 → 05 → 17; 19, 20, 21 amplían identidad.

**Buscador + descubrimiento (mes 4-6, OE2):** 06, 07, 08, 09; 23 (portfolio), 24 (disponibilidad), 28 (favoritos).

**Operación (mes 4-8):** 10, 11, 12, 13; 27 (multi-rol).

**Sostenibilidad (mes 8-12, OE3):** 14, 15, 18.

**Compliance / DevOps transversal:** 22 (Ley 19.628), 25 (health), 26 (CI/CD).

## Priorización sugerida (sprints)

| Sprint | Foco | REQs activos |
|--------|------|--------------|
| 1 | Identidad y onboarding | 01, 16, 17, 19, 20 |
| 2 | Prestador puede publicarse | 02, 03, 04, 21, 27 |
| 3 | Vitrina y descubrimiento | 05, 06, 07, 23, 24 |
| 4 | Conexión y confianza | 08, 09, 10, 28 |
| 5 | Operación | 11, 12, 13 |
| 6 | Sostenibilidad económica | 14, 15, 18 |
| 7 | Compliance + plataforma | 22, 25, 26 |
