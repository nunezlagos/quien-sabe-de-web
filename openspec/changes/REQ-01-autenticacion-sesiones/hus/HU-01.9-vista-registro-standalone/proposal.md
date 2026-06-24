# HU-01.9 — Proposal: Vista `/registro` con mensaje "demo cerrada"

## Por qué

- `src/pages/registro.astro` tiene un form completo de signup.
- En esta fase el signup está deshabilitado (REQ-01 lo difiere).
- Si dejamos el form tal cual, los usuarios van a intentar registrarse y van a fallar con un error 410 confuso desde el backend.
- Mejor: mostrar el mensaje en el cliente, antes de que intenten enviar.

## Alternativas

| Alternativa | Pro | Contra | Decisión |
|---|---|---|---|
| **Mantener form + agregar mensaje arriba** | Mínimo cambio | UX confusa (form visible pero inútil) | ❌ |
| **Reescribir `/registro` como página informativa con CTA a login** | UX clara, sin código muerto | Hay que refactorizar y crear mockup | ✅ |
| **Borrar `/registro` y hacer 404** | Más simple | Links desde navbar/footer rompen; SEO bad | ❌ |
| **Redirigir `/registro` → `/iniciar-sesion`** | Sin página nueva | Pierde oportunidad de comunicar el estado de la demo | ❌ |

## Decisión final

Reescribir `src/pages/registro.astro` como página informativa con CTA a `/iniciar-sesion`. Endpoint `POST /api/v1/auth/registro` queda pero responde 410.

## Vista propuesta

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const url = Astro.url;
const redirigir = url.searchParams.get('redirigir') ?? '/dashboard';

// Si ya hay sesión, redirigir
if (Astro.locals.user) {
  return Astro.redirect(redirigir);
}
---
<BaseLayout title="Registro cerrado — QuiénSabe">
  <main class="auth-page">
    <a href="/" class="auth-page__back">← Volver al inicio</a>
    <article class="auth-card auth-card--info">
      <div class="auth-card__icon">
        <i class="ri-lock-2-line"></i>
      </div>
      <h1 class="auth-card__title">El registro está cerrado durante la demo</h1>
      <p class="auth-card__subtitle">
        Estamos en una fase de prueba con usuarios pre-seleccionados.
        Pronto abriremos el registro público.
      </p>

      <ul class="auth-card__list">
        <li>
          <i class="ri-user-smile-line"></i>
          <span>Usa uno de los <b>usuarios demo</b>: <code>vecino@demo.cl</code>, <code>prestador@demo.cl</code> o <code>admin@demo.cl</code> (contraseña: <code>Demo1234</code>).</span>
        </li>
        <li>
          <i class="ri-login-box-line"></i>
          <span>Inicia sesión desde la página <a href={`/iniciar-sesion?redirigir=${encodeURIComponent(redirigir)}`}>Iniciar sesión</a>.</span>
        </li>
        <li>
          <i class="ri-mail-send-line"></i>
          <span>Solicita acceso anticipado escribiéndonos a <a href="mailto:earlyaccess@quiensabe.cl">earlyaccess@quiensabe.cl</a>.</span>
        </li>
      </ul>

      <a href={`/iniciar-sesion?redirigir=${encodeURIComponent(redirigir)}`} class="btn btn--primary btn--block">
        Iniciar sesión con un usuario demo
      </a>

      <p class="auth-card__legal">
        ¿Ya tienes cuenta? <a href={`/iniciar-sesion?redirigir=${encodeURIComponent(redirigir)}`}>Inicia sesión</a>.
      </p>
    </article>
  </main>
</BaseLayout>
```

> Nota: NO hay `<script>` inline — la vista es 100% estática. Los links son `<a href>` nativos.

## Endpoint `registro.ts` con 410

```ts
// src/pages/api/v1/auth/registro.ts
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * DEPRECATED en fase demo — ver HU-01.9.
 * El registro público se deshabilitó. Este endpoint queda declarado
 * para no romper imports/tests existentes, pero responde 410 Gone.
 * Para reactivar, ver HU-01.1 (alcance original).
 */
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'registro deshabilitado en esta fase' }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
};
```

## Convenciones aplicadas

- **R1**: 0 inline styles.
- **R2**: 0 `<script>` inline (la vista es 100% declarativa).
- **R3**: sin componentes nuevos (la vista es única).
- **R4**: clases `auth-card`, `auth-card--info`, `auth-card__icon`, etc.