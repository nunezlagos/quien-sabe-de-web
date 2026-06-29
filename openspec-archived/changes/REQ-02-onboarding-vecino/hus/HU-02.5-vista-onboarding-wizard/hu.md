# HU-02.5 — Vista `/onboarding` wizard para vecinos nuevos

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-02-onboarding-vecino

## Historia de usuario

**Como** vecino que acaba de iniciar sesión por primera vez
**Quiero** un wizard que me pida mi comuna, mis preferencias y acepte los términos
**Para** completar mi perfil básico y desbloquear el resto de la app

## Contexto

REQ-02 menciona un wizard de onboarding pero no hay mockup. Esta HU lo
define y crea la vista.

**Importante**: en esta fase el registro público está deshabilitado
(REQ-01), por lo que el onboarding solo aplica a los 3 usuarios demo
pre-sembrados (HU-01.7). El wizard debe ser triggerable desde un flag
`onboarding_completed=false` en `users`.

## Mockup de referencia

- `mockups/onboarding.html` (a crear en esta HU) — wizard de 3 pasos:
  1. **Paso 1: Comuna**
     - Título "¿En qué comuna vives?"
     - Dropdown con las 52 comunas RM (REQ-02.1)
     - Botón "Siguiente"
  2. **Paso 2: Preferencias**
     - Título "¿Qué oficios te interesan?"
     - Multi-select con tags de oficios (gasfiter, electricista, etc.)
     - Toggle "¿Querés recibir emails con vecinos nuevos en tu barrio?"
     - Botones "Atrás" / "Siguiente"
  3. **Paso 3: Consentimientos**
     - Título "Último paso: aceptemos los términos"
     - Checkboxes:
       - "Acepto los términos y condiciones" (requerido)
       - "Acepto la política de privacidad (Ley 19.628)" (requerido)
       - "Quiero aparecer en el ranking público de mi comuna" (opcional, default ON)
     - Botón "Completar onboarding"

## Criterios de aceptación (Gherkin)

### Escenario: Acceso al wizard
  Dado usuario `vecino@demo.cl` con `onboarding_completed=false`
  Cuando visito cualquier ruta (excepto `/onboarding`, `/iniciar-sesion`, `/logout`)
  Entonces se redirige a `/onboarding`

### Escenario: Paso 1 selecciona comuna
  Cuando elijo "Las Condes" y click "Siguiente"
  Entonces se avanza al paso 2 con la comuna seleccionada guardada en estado

### Escenario: Paso 2 selecciona oficios y preferencia de email
  Cuando elijo "Gasfiter" + "Electricista" y desmarco emails
  Entonces se guarda: `preferences.trades = ["gasfiter", "electricista"]`, `preferences.email_opt_in = false`

### Escenario: Paso 3 requiere aceptar términos
  Cuando no tildo "Acepto los términos" e intento click "Completar"
  Entonces se muestra error "Debes aceptar los términos para continuar"
  Y NO se completa el onboarding

### Escenario: Wizard completo
  Cuando completo los 3 pasos con datos válidos
  Entonces se hace `POST /api/v1/users/me/profile`
  Y se marca `users.onboarded_at = <now>`
  Y se redirige a `/dashboard`

### Escenario: Botón "Atrás" preserva datos
  Dado que estoy en el paso 3
  Cuando click "Atrás"
  Entonces vuelvo al paso 2 con mis selecciones previas intactas

### Escenario: Refrescar la página no pierde estado
  Cuando estoy en paso 2 y refresco
  Entonces el wizard sigue en paso 2 con mis selecciones

### Escenario: Ya completó onboarding no puede entrar
  Dado `vecino@demo.cl` con `onboarding_completed=true`
  Cuando visito `/onboarding`
  Entonces se redirige a `/dashboard`

## Tareas técnicas

- [ ] Agregar columnas `onboarded_at INTEGER` y `commune_id INTEGER` a `users`. Las preferencias se guardan en tabla aparte `user_preferences` (no columna JSON), según req.md.
- [ ] Migración `00XX_users_onboarding.sql`
- [ ] Endpoint `src/pages/api/v1/users/me/profile.ts` (POST, sesión vecino):
  - Valida body con Zod (`{ commune_id, trades[], email_opt_in, consents{terms,privacy,ranking} }`)
  - Update `users` con los datos
  - Marca `onboarded_at=<now>`
  - Retorna 200
- [ ] Helper `requiereOnboarding(locals)` en `src/middleware.ts` que redirige a `/onboarding` si el usuario tiene `role='vecino'` y `onboarding_completed=0`
- [ ] Mockup `mockups/onboarding.html` (3 pasos como cards estáticas con navegación visual)
- [ ] Vista `src/pages/onboarding.astro`:
  - Detecta paso actual desde `?paso=1|2|3` query param
  - Reusa estilos de `src/styles/pages/login.css` para consistencia
  - Mantiene estado en `sessionStorage` (no en cookie, para no contaminar el server)
- [ ] Componente `src/components/onboarding/WizardStep.astro` con prop `paso`, `titulo`, `children`
- [ ] Componente `src/components/onboarding/WizardProgress.astro` con indicador visual 1/3, 2/3, 3/3
- [ ] Lógica de cliente:
  - `src/lib/client/onboarding/state.ts` — get/set estado en sessionStorage
  - `src/lib/client/onboarding/navigation.ts` — siguiente/anterior/submit
  - `src/lib/client/onboarding/validation.ts` — validar paso antes de avanzar
- [ ] Tests:
  - Unit: `validation.ts` con casos válidos/inválidos
  - Integración: `POST /onboarding` con body válido/inválido, 401 sin sesión, 403 admin
  - E2E: `tests/e2e/onboarding-wizard.spec.ts` con los 8 escenarios

## Definition of done

- [ ] Mockup revisado
- [ ] Tests unit + integración + E2E pasan
- [ ] Sabotaje 1: no marcar `onboarding_completed=1` en el endpoint → al volver a `/dashboard`, el middleware redirige de vuelta a `/onboarding` → test E2E rojo → restaurar
- [ ] Sabotaje 2: no validar términos requeridos → test unitario de validación rojo → restaurar
- [ ] Sabotaje 3: no preservar estado en sessionStorage → test E2E "refrescar no pierde estado" rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/client/onboarding/`
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] JS extraído a archivos `.ts` aparte (R2)
- [ ] `WizardStep` y `WizardProgress` reusables
- [ ] PR mergeado a `develop`

## Riesgos / notas

- En esta fase con registro deshabilitado, los únicos usuarios que pueden llegar al wizard son los 3 demos. El middleware debe permitir el paso a `/onboarding` sin redirigir a `/onboarding` en loop.
- El estado del wizard vive en `sessionStorage` (no en DB hasta el submit final) para evitar escribir a la DB en cada paso.
- Si el usuario cierra el browser a mitad del wizard, pierde el estado y debe volver a empezar. Esto es aceptable para esta fase; en el futuro se puede agregar un autosave.