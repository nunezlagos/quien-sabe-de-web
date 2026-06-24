# Propuesta — HU-14.1 — Landing `/donate` con CTA y montos sugeridos

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

La landing `/donate` es el punto de entrada público para que cualquier usuario (anon o autenticado) inicie una donación. Debe comunicar el destino de los fondos (OE3), ofrecer montos sugeridos que reducen fricción, y mostrar el selector de pasarela (Mercado Pago / Webpay). La conversión depende de que la UI sea clara y de que el botón principal esté visible sin scroll en mobile. Esta HU es 100% frontend + integración con los endpoints de checkout (HU-14.2 MP, HU-14.4 Webpay).

## Mockups de referencia

- **mockup TBD** — No existe mockup dedicado para `/donate`. La página de transparencia (`mockups/transparency.html:46-58`) cubre métricas (Ingresos/Gastos/Fondo) pero NO el checkout con montos sugeridos. La propuesta visual se basa en el lenguaje común del proyecto: cards rounded-3xl, paleta `primary` verde, íconos Remix, copy cercano a `mockups/transparency.html:42-44` ("Así es como usamos cada peso que donas. Cuentas claras, amistad larga.").

## Alternativas considered

### Opcion A — Landing SSR `/donate` con componentes `AmountSelector` y `PaymentButtons`, fetch a checkout
- Render server-side del shell + islands de Astro para los botones.
- Pro: SEO friendly (la landing debe rankear para "donar" en Chile).
- Pro: el SSR puede leer settings (HU-13.6) para mostrar/ocultar pasarelas según disponibilidad.
- Contra: requiere hidratación mínima para el fetch.

### Opcion B — Single Page App cliente con React/Vue
- Pro: UX más fluida.
- Contra: contradice Astro SSR del proyecto; pierde SEO.

### Opcion C — Link directo a Mercado Pago sin landing propia
- Pro: cero código.
- Contra: perdemos el control del copy, montos sugeridos y selector de pasarela; tracking de conversiones es más difícil.

## Decision

Se elige **Opcion A**. Una landing SSR con dos componentes (`AmountSelector` con 4 montos sugeridos + custom, `PaymentButtons` con MP y Webpay condicionales). El fetch al checkout se hace desde un script mínimo en el cliente. La landing es pública (no requiere sesión), con la opción de donar autenticado para que la donación quede asociada al `user_id` (HU-14.2 lo soporta).

## Riesgos y mitigaciones

- Riesgo: el monto mínimo 1000 CLP es arbitrario y puede dejar fuera donaciones de prueba → Mitigación: documentado en la propuesta; ajustable via setting `min_donation_clp` (HU-13.6, fuera de scope acá).
- Riesgo: el checkout con MP/Webpay no está listo al deploy de esta HU → Mitigación: la landing degrada mostrando sólo las pasarelas configuradas (check via `env.MERCADOPAGO_ACCESS_TOKEN` presente o no); si ninguna está, mensaje "donaciones no disponibles, vuelve pronto".
- Riesgo: la landing muestra el saldo/transparencia y confunde con checkout → Mitigación: la landing es separada de `/transparency` (REQ-15); link cruzado en el footer.

## Metrica de exito

- GET `/donate` → 200 con SSR HTML que incluye los 4 montos sugeridos + selector custom + al menos 1 botón de pasarela.
- Click en "Donar $5.000 con Mercado Pago" → POST `/api/v1/donations/checkout` con `amount_clp=5000` → redirect a `init_point` MP.
- Submit con `amount_clp=500` → error inline "mínimo $1.000" sin enviar request.
- E2E Playwright: tres escenarios Gherkin verdes.
