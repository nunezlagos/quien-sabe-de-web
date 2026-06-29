# HU-22.1 — Cookie banner inicial con elección persistida

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-22-compliance-ley-19628
**Rama:** `feat/HU-22.1-cookie-banner`

## Tareas técnicas

- [ ] **T1** Helper `src/lib/utils/signed-cookie.ts` con `signCookie(value, secret)` y `verifyCookie(signed, secret)`. Usa Web Crypto API (`crypto.subtle.importKey` + `sign`/`verify` con HMAC-SHA256). Secret leído de `env.CONSENT_SECRET`.
- [ ] **T2** Validador `cookieConsentSchema` en `src/lib/validators/consent.ts` con Zod (`analytics`, `communications`, `public_profile` boolean; `source` enum `banner|modal|settings`).
- [ ] **T3** Endpoint `src/pages/api/v1/consent/cookies.ts` (POST, público):
  - Parsea body con `cookieConsentSchema` → 400 si falla.
  - Lee sesión opcional (`Astro.locals.session`) → si existe, `userId = session.userId`, sino `null`.
  - Responde 200 `{ok: true}`. (HU-22.5 agregará persistencia.)
- [ ] **T4** Componente `src/components/legal/CookieBanner.astro` con markup sticky-bottom (estilo `mockups/about.html:48-61`). Botones `consent-accept-all`, `consent-necessary`, `consent-configure` con `id` únicos.
- [ ] **T5** Script inline en el componente:
  - Lee `document.cookie` para `qs_consent`; si no existe o `verifyCookie` falla, muestra banner.
  - Click handlers: cada botón setea la cookie firmada (`max-age=31536000; SameSite=Lax`) + `fetch POST /api/v1/consent/cookies` + oculta banner.
  - Click "Configurar" emite `CustomEvent('consent:configure')` (escuchado por HU-22.5).
- [ ] **T6** Insertar `<CookieBanner />` en `src/layouts/Layout.astro` antes del cierre de `</body>`.
- [ ] **T7** Agregar `CONSENT_SECRET` a `.dev.vars.example` (valor de ejemplo, no real). Documentar en README cómo generar uno (`openssl rand -hex 32`).
- [ ] **T8** Tests:
  - [ ] `tests/unit/utils/signed-cookie.test.ts` — `signCookie("a", "secret")` produce `"a.<hex64>"`; `verifyCookie` acepta valor íntegro, rechaza alteración de valor, rechaza alteración de firma, retorna null para string sin `.`.
  - [ ] `tests/unit/validators/consent.test.ts` — schema acepta payload completo; rechaza flag faltante (`analytics` ausente); rechaza `source: "invalid"`; acepta `source: "banner"`.
  - [ ] `tests/integration/consent/cookies.test.ts` — POST con body válido devuelve 200; POST sin body devuelve 400; POST con sesión válida persiste `user_id` en mock del servicio (verificado en HU-22.5).
  - [ ] `tests/e2e/cookie-banner.spec.ts` (Playwright) — primera visita (borrar cookies) muestra banner; click "Aceptar todo" → cookie `qs_consent` presente + banner oculto; reload no muestra banner; click "Sólo necesarias" → flags en false; alterar cookie manualmente en devtools y reload → banner reaparece.
  - [ ] Sabotaje 1: en el script del banner, olvidar el `banner.classList.add('hidden')` tras click → E2E verifica que el banner sigue visible tras click (test rojo) → restaurar.
  - [ ] Sabotaje 2: en `signCookie`, olvidar agregar `.${hmac}` al final → `verifyCookie` siempre retorna null → banner reaparece en cada visita → E2E verifica que la cookie no persiste (test rojo) → restaurar.
  - [ ] Sabotaje 3: en el endpoint POST, no parsear con Zod → 400 nunca se devuelve → test integración con body malformado espera 400 y recibe 200 (test rojo) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (incluye persistencia y tampering)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/utils/signed-cookie.ts` y `src/lib/validators/consent.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: cookie banner con elección firmada` y push a rama (no merge a main)