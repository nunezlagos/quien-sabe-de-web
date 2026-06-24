# HU-16.7 — Vista `/about` institucional (página "Quiénes somos")

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** visitante anónimo
**Quiero** una página `/about` que explique qué es QuiénSabe, su misión y equipo
**Para** entender la propuesta de valor y confiar en la plataforma antes de donar o registrarse

## Contexto

REQ-16 menciona `/about` en su lista de páginas estáticas, pero el mockup
estaba mal nombrado: `mockups/about.html` en realidad contiene la landing
de donaciones (REQ-14) y se renombró a `mockups/donate.html` en esta fase.

Esta HU cierra el gap: crea la vista y mockup reales para `/about`.

## Mockup de referencia

- `mockups/about.html` (a crear en esta HU) — vista institucional con:
  - Hero "Somos QuiénSabe" + tagline + CTA dual (Donar / Registrarme)
  - Sección "Misión" (texto corto, 2-3 párrafos)
  - Sección "Cómo funciona" (3 pasos visuales: Busca → Contacta → Califica)
  - Sección "Equipo" (placeholder para 3-4 miembros con foto+nombre+rol)
  - Sección "Transparencia" (link a `/transparency`)
  - Footer consistente con resto de páginas

## Criterios de aceptación (Gherkin)

### Escenario: GET /about carga correctamente
  Cuando visito `GET /about`
  Entonces recibo status 200
  Y la página renderiza el hero, misión, cómo-funciona, equipo
  Y los links internos navegan correctamente (donate, login, transparency)

### Escenario: Header y footer consistentes
  Cuando inspecciono el header y footer
  Entonces son los mismos que el resto de páginas (reusar componentes)

### Escenario: Sin sesión no se rompe
  Cuando visito sin cookie `session`
  Entonces se renderiza normal (no redirige)

### Escenario: Con sesión redirige al dashboard desde CTA
  Dado cookie `session` válida de un vecino
  Cuando hago click en "Registrarme"
  Entonces el link va a `/dashboard` (no a `/registro`, porque ya estoy logueado)

## Tareas técnicas

- [ ] Mockup `mockups/about.html` siguiendo patrón visual de `mockups/transparency.html` (mismo navbar, mismo footer)
- [ ] Vista `src/pages/about.astro` con:
  - Hero con CTA dual (botón primario "Donar" → `/donate`, botón secundario "Iniciar sesión" → `/iniciar-sesion`)
  - Secciones semánticas (`<section>` con `<h2>`)
  - Reuso de `<BaseLayout>` y componentes de navbar/footer
- [ ] Componente `src/components/layout/StaticPageHero.astro` (reutilizable para `/about`, `/faq`, `/terms`, `/privacy` — todos comparten patrón de hero)
- [ ] Sin `<script>` inline (R2) — la página es 100% declarativa
- [ ] Sin `style="..."` inline (R1)
- [ ] Tests E2E `tests/e2e/about-page.spec.ts`:
  - GET `/about` → 200, contenido completo
  - Click en CTA "Donar" → redirige a `/donate`
  - Click en CTA "Iniciar sesión" → redirige a `/iniciar-sesion`
  - Con sesión activa → CTA "Iniciar sesión" redirige a `/dashboard`

## Definition of done

- [ ] Mockup revisado
- [ ] Tests E2E pasan
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] Sin `<script>` inline
- [ ] `StaticPageHero` reusable para al menos 2 vistas (`/about` + `/faq`)
- [ ] PR mergeado a `develop`

## Riesgos / notas

- Esta HU **NO** es la landing de donaciones. La página `/donate` (mockup `donate.html`) cubre REQ-14.
- Las fotos del equipo son placeholder (puede ser un set de avatars genéricos hasta que se consigan fotos reales).