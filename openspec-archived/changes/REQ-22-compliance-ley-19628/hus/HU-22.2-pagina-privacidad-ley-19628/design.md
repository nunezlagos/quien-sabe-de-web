# Diseño técnico — HU-22.2 — Página /privacy cubriendo Ley 19.628

**REQ padre:** REQ-22-compliance-ley-19628

## Modelo de datos

No aplica. Esta HU no introduce tablas ni endpoints.

## Contrato de API

No aplica. Página estática renderizada en SSR de Astro.

## Validaciones Zod

No aplica.

## Componentes UI

### Vista Astro
- `src/pages/privacy.astro`:
  - Layout `src/layouts/Layout.astro`.
  - Background `bg-bg-light text-gray-800 font-sans flex flex-col min-h-screen` (idéntico a `mockups/terms.html:28`).
  - Navbar mínimo (logo + link "Volver").
  - Main `container mx-auto px-4 py-12 max-w-4xl flex-grow` con card `bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100`.
  - H1 `text-3xl font-extrabold text-gray-800 mb-8`: "Política de Privacidad".
  - Cuerpo: importar `src/content/legal/privacy.md` y renderizar con `Content` de `astro:content`.
  - Footer con la fecha de actualización: `<p class="text-sm text-gray-400">Última actualización: YYYY-MM-DD</p>`.

### Contenido legal
- `src/content/legal/privacy.md` con frontmatter:
  ```md
  ---
  title: "Política de Privacidad"
  lastUpdated: "2026-06-18"
  ---
  ```
  Secciones obligatorias (h2):
  1. Datos que recolectamos
  2. Finalidades del tratamiento
  3. Responsable del tratamiento
  4. Derechos ARCO+P
  5. Plazo de conservación
  6. Transferencias internacionales
  7. Contacto del DPO

### Footer global
- `src/components/layout/Footer.astro` (o donde esté el footer global) — agregar `<a href="/privacy" class="hover:text-primary transition font-bold text-gray-300 hover:scale-105 transform">Privacidad</a>` entre "Términos" y "Transparencia".
- Replicar el patrón de `mockups/dashboard-user.html:135-139`.

## Flujo de interacción (secuencial)

1. Usuario hace click en "Privacidad" del footer.
2. Navega a `/privacy`.
3. SSR renderiza el layout + importa el markdown.
4. HTML resultante contiene las 7 secciones con headings h2.
5. Footer de la misma página también expone el link "Privacidad" (consistencia).

## Capa de servicios

No aplica.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| E2E | `tests/e2e/privacy-page.spec.ts` (Playwright) — `GET /privacy` devuelve 200; HTML contiene los 7 h2 obligatorios (Datos recolectados, Finalidades, Responsable, Derechos ARCO+P, Plazo de conservación, Transferencias, Contacto del DPO); footer expone link `/privacy`. |
| Visual | Snapshot del HTML vs `mockups/terms.html` para validar misma estructura. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-16 (layout base + footer global).
- **Bloquea a:** ninguna HU directa; requerida por REQ-22 (compliance global).
- **Recursos compartidos:** `src/layouts/Layout.astro`, `src/components/layout/Footer.astro`, `src/content/legal/`.

## Riesgos técnicos

- Riesgo: Astro Content Collections requiere config `src/content/config.ts` con schema → Mitigación: agregar el schema para `legal` collection; documentar en `astro.config.mjs`.
- Riesgo: el markdown tiene caracteres especiales que rompen el render → Mitigación: usar `remark-gfm` ya presente en Astro; test E2E verifica que el HTML no tiene entidades escapadas innecesarias.
- Riesgo: el footer tiene tres versiones (uno por mockup) y se debe actualizar el correcto → Mitigación: grep `terms.html` en mockups y `Términos` en código; el footer global debe ser único en `src/components/layout/Footer.astro`.