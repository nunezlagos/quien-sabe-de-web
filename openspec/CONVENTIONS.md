# Convenciones de implementación — quien-sabe-de-web

Reglas transversales que aplican a **todo el código de producción** (páginas
`.astro`, componentes, layouts). No aplican a mockups HTML estáticos (esos
son referencia visual), pero sí aplican cuando un mockup se traduzca a
código real.

## R1 — Sin CSS inline en markup

**Prohibido** escribir `style="..."` directamente en los tags HTML/JSX/Astro.

- Todo estilo va a una clase CSS en `src/styles/` o en una utility class de Tailwind.
- Estilos específicos de un componente van en `<style>` dentro del archivo `.astro` del componente (scoped por defecto), o mejor aún, en un `*.module.css` si el componente es reutilizable.
- Si necesitás un valor dinámico, definilo como CSS custom property (`--mi-color: red`) y usalo desde la clase.

**Ejemplo malo:**
```astro
<button class="btn" style="background-color: #ff5500; padding: 12px">Enviar</button>
```

**Ejemplo bueno:**
```astro
<button class="btn btn--primary">Enviar</button>
```
```css
/* src/styles/components.css */
.btn--primary { background-color: var(--color-accent); padding: var(--space-3); }
```

## R2 — Sin JS inline en markup

**Prohibido** poner lógica de negocio, event handlers, fetch, etc., dentro
de un `<script>` en línea en una página `.astro`. El tag `<script>` inline
de Astro solo se permite para hidratación trivial de una isla; cualquier
lógica mayor va a un archivo `.ts` aparte.

- Lógica de cliente → `src/lib/client/<dominio>.ts` (exportar funciones puras testeables)
- Si la lógica es 100% específica de una página y no se reutiliza, también va a un archivo `.ts` (mejor para testear y para mantener).
- El HTML de la página solo estructura; el `<script>` inline (si existe) es de **hidratación mínima** (1-3 líneas).

**Ejemplo malo:**
```astro
<form id="form-login">...</form>
<script>
  const form = document.getElementById('form-login');
  form.addEventListener('submit', async (e) => {
    const fd = new FormData(form);
    const resp = await fetch('/api/v1/auth/iniciar-sesion', { ... });
    // 40 líneas de lógica
  });
</script>
```

**Ejemplo bueno:**
```astro
<!-- src/pages/iniciar-sesion.astro -->
<form id="form-login" data-redirigir="/dashboard">...</form>
<script>
  import { inicializarFormularioLogin } from '../lib/client/auth/login';
  inicializarFormularioLogin();
</script>
```
```ts
// src/lib/client/auth/login.ts
export function inicializarFormularioLogin() {
  const form = document.getElementById('form-login') as HTMLFormElement | null;
  if (!form) return;
  form.addEventListener('submit', async (e) => { /* ... */ });
}
```

## R3 — Reutilizable → componente/template

Si un bloque visual o lógico se usa **2 o más veces**, va a un componente
(`src/components/<dominio>/<Nombre>.astro`) o a un helper reutilizable
(`src/lib/<dominio>/<funcion>.ts`).

- **Componentes Astro** en `src/components/<dominio>/`
- **Layouts** en `src/layouts/`
- **Utilities de cliente** en `src/lib/client/<dominio>.ts`
- **Servicios de servidor** en `src/lib/services/<dominio>.ts`
- **Validadores Zod** en `src/lib/validators/<dominio>.ts`

**Detección de duplicación:**
- Si al hacer copy-paste de un bloque tenés que cambiar 1-2 valores → extraé a componente con props.
- Si tenés 3+ archivos `.astro` con el mismo `<script>` inline → extraé a `.ts`.

## R4 — Naming

- Componentes Astro: `PascalCase.astro` (`AuthButtons.astro`, `AvailabilityBadge.astro`)
- Utilidades cliente: `camelCase.ts` (`login.ts`, `toggleAvailability.ts`)
- Servicios servidor: `camelCase.ts` (`auth/session.ts`, `availability/toggle.ts`)
- CSS classes: `kebab-case` y prefijadas por componente (`btn--primary`, `auth-buttons__icon`)

## Cómo reflejar estas reglas en un HU

Cuando escribas o refines un HU, agregá en "Tareas técnicas":

```
- [ ] Estilos en clases (no inline) — verificar con `grep -n 'style="' src/`
- [ ] JS extraído a `src/lib/client/...` si la lógica > 5 líneas
- [ ] Si el bloque se reutiliza 2+ veces → componente en `src/components/<dominio>/`
```

Y en "Definition of done":

```
- [ ] `grep -rn 'style="' src/pages src/components src/layouts` → 0 ocurrencias
- [ ] `grep -rn '<script>' src/pages src/components src/layouts` solo contiene imports o hidratación trivial
```