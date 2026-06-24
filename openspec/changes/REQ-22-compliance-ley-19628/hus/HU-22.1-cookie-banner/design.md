# Diseño técnico — HU-22.1 — Cookie banner inicial con elección persistida

**REQ padre:** REQ-22-compliance-ley-19628

## Modelo de datos

No introduce tablas en esta HU. El audit del POST se persiste en una tabla `consent_log` que se crea en HU-22.5; aquí sólo se acepta el POST sin persistir.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/consent/cookies` | POST | público | `{analytics: bool, communications: bool, public_profile: bool, source: 'banner'}` | `{ok: true}` | 400 (body inválido) |

Si el visitante está logueado (cookie de sesión válida), el handler asocia la decisión al `user_id` para el audit de HU-22.5; si no, sólo registra como `anonymous` (sin PII).

## Validaciones Zod

```ts
// src/lib/validators/consent.ts
export const cookieConsentSchema = z.object({
  analytics: z.boolean(),
  communications: z.boolean(),
  public_profile: z.boolean(),
  source: z.enum(['banner', 'modal', 'settings']),
})
```

## Componentes UI

### Componente Astro
- `src/components/legal/CookieBanner.astro` — server-rendered pero su contenido sólo se muestra client-side.
- Hidratación con `<script>` inline que:
  - Lee `document.cookie` para `qs_consent`.
  - Si no existe o la firma no valida, muestra el banner.
  - Si existe, no renderiza.
- Markup del banner (sticky bottom):
  ```astro
  <div id="cookie-banner" class="fixed bottom-0 left-0 right-0 z-50 p-4 hidden">
    <div class="max-w-4xl mx-auto bg-white shadow-lg border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4">
      <i class="ri-cookie-line text-3xl text-primary"></i>
      <div class="flex-1">
        <h3 class="font-bold text-gray-800 text-base">Esta web usa cookies</h3>
        <p class="text-gray-600 text-sm mt-1">Usamos cookies para mejorar tu experiencia y analizar el tráfico. Puedes aceptar todas, sólo las necesarias o configurar cuáles autorizas.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <button id="consent-configure" class="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Configurar</button>
        <button id="consent-necessary" class="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition">Sólo necesarias</button>
        <button id="consent-accept-all" class="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition shadow-md">Aceptar todo</button>
      </div>
    </div>
  </div>
  ```

### Integración en `src/layouts/Layout.astro`
- Insertar `<CookieBanner />` al final del `<body>`.

### Helper de cookie firmada
- `src/lib/utils/signed-cookie.ts`:
  - `signCookie(value: string, secret: string): string` → `${value}.${hmacSha256(value, secret)}`.
  - `verifyCookie(signed: string, secret: string): value | null` → verifica firma, devuelve el valor o `null`.

### Endpoint
- `src/pages/api/v1/consent/cookies.ts` (POST, público):
  - Parse con `cookieConsentSchema`.
  - Si hay sesión, leer `userId` (opcional); sino, `null`.
  - `return { ok: true }` (HU-22.5 persiste).

## Flujo de interacción (secuencial)

1. Visitante llega a cualquier ruta.
2. SSR no muestra el banner; HTML incluye `<CookieBanner />` con `hidden` por default.
3. Script inline en el componente:
   - Lee `qs_consent` de `document.cookie`.
   - Si no existe o `verifyCookie` retorna null → `banner.classList.remove('hidden')`.
4. Usuario hace click en uno de los 3 botones:
   - "Aceptar todo" → `signCookie(JSON.stringify({analytics:true, communications:true, public_profile:true}), secret)` → `document.cookie = 'qs_consent=' + signed + '; path=/; max-age=31536000; SameSite=Lax'` + `fetch POST /api/v1/consent/cookies` + `banner.classList.add('hidden')`.
   - "Sólo necesarias" → análogo con todos los flags en false.
   - "Configurar" → emite evento custom `consent:configure` que HU-22.5 escucha para abrir modal granular.
5. Cookie firmada presente → banner no aparece en próximas visitas.

## Capa de servicios

- `src/lib/utils/signed-cookie.ts` — `signCookie` y `verifyCookie` (HMAC-SHA256 con `crypto.subtle`).
- `src/lib/services/consent/cookies.ts` (placeholder; HU-22.5 lo completa) — `recordCookieConsent(env, userId | null, payload)`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/signed-cookie.test.ts` — `signCookie` produce string con `.` separador; `verifyCookie` acepta valor válido, rechaza valor alterado, rechaza firma alterada, retorna null para cookie vacía. |
| Unit | `tests/unit/validators/consent.test.ts` — `cookieConsentSchema` acepta/rechaza flags faltantes, tipos incorrectos, source fuera de enum. |
| Integración | `tests/integration/consent/cookies.test.ts` — POST público devuelve 200; POST con sesión persiste `user_id` en audit (HU-22.5 lo verifica); POST sin body devuelve 400. |
| E2E | `tests/e2e/cookie-banner.spec.ts` — primera visita muestra banner; click "Aceptar todo" setea cookie y oculta banner; reload siguiente no muestra banner; click "Sólo necesarias" setea flags en false; alterar cookie en devtools la invalida al próximo load. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión opcional para audit), HU-22.5 (modal Configurar; aquí sólo se dispara el evento).
- **Bloquea a:** HU-22.5 (modal granular reutiliza el helper de cookie firmada), REQ-18 (analytics server-side debe leer `qs_consent`).
- **Recursos compartidos:** `src/lib/utils/signed-cookie.ts` (helper compartido con HU-27.3), `src/layouts/Layout.astro`.

## Riesgos técnicos

- Riesgo: el secreto HMAC debe venir de `wrangler secret` → Mitigación: lectura vía `env.CONSENT_SECRET` con fallback a un valor fijo sólo en tests (`process.env.CONSENT_SECRET ?? 'test-secret'`).
- Riesgo: el banner no se muestra en SSR → Mitigación: el contenido se inyecta en HTML pero oculto por CSS; el script inline lo muestra tras validar. No afecta LCP/SEO.
- Riesgo: `SameSite=Lax` no funciona en cross-site → Mitigación: la cookie es first-party, no hay escenario cross-site esperado.