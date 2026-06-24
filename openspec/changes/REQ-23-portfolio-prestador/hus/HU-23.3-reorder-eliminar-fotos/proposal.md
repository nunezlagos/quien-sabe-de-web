# Propuesta — HU-23.3 — Reorder y eliminar fotos del portfolio

**Estado:** propuesta | **REQ padre:** REQ-23-portfolio-prestador

## Contexto

Tras subir fotos (HU-23.2) el prestador necesita controlar qué se muestra primero y poder eliminar imágenes obsoletas. El mockup ya expone el botón delete con `<i class="ri-delete-bin-line">` en `mockups/dashboard-provider.html:163` pero el reorden no está dibujado explícitamente (asumimos drag-drop sobre el mismo grid, descrito en `req.md:20`). Esto contribuye a OE1 dando agencia al prestador sobre su perfil público.

## Mockups de referencia

- `mockups/dashboard-provider.html:163,169` — botón delete `<i class="ri-delete-bin-line text-xl">` por card.
- `mockups/dashboard-provider.html:158` — grid `grid-cols-2 md:grid-cols-5 gap-3`, contenedor sobre el que opera el drag-drop.
- `mockups/dashboard-provider.html:160-171` — estructura de card existente, mantiene su shape al reordenarse.
- Nota: no hay handle de drag en el mockup; UI a diseñar como interacción "long-press o drag desde la imagen" siguiendo el estilo visual existente.

## Alternativas consideradas

### Opción A — `PATCH .../reorder` con array completo + `DELETE .../:id` + compactación
- Descripción: el cliente envía el array final ordenado de ids; el servidor reescribe `sort_order` en lote. El delete elimina fila + objeto R2 y compacta.
- Pro: contrato simple, atómico, alineado con el ejemplo del HU `{"order":[42,12,33]}` → `sort_order` 0,1,2.
- Contra: el cliente debe conocer todos los ids al reordenar (no es problema, son ≤ 5).

### Opción B — `PATCH .../:id` con nuevo `sortOrder` individual
- Descripción: actualizar una fila a la vez.
- Pro: payload pequeño.
- Contra: cascada de updates colisiona con UNIQUE `(provider_id, sort_order)`, requiere lógica de "shift" no trivial.

### Opción C — Soft delete con flag `deleted_at`
- Descripción: marcar como borrado sin eliminar R2.
- Pro: posibilidad de "papelera".
- Contra: ocupa cuota R2, complica conteo de capacidad, no es feature pedida por el REQ.

## Decisión

Se adopta la **Opción A**: `PATCH /api/v1/providers/me/portfolio/reorder` con el array final + `DELETE /api/v1/providers/me/portfolio/:id` con compactación inline. El array completo evita estados intermedios inválidos contra el UNIQUE compuesto y se ejecuta en una transacción.

## Riesgos y mitigaciones

- Riesgo: UNIQUE `(provider_id, sort_order)` colisiona durante el `UPDATE` en lote → mitigación: dos pasadas dentro de la transacción — primera asigna offsets temporales (100, 101, ...), segunda asigna 0..n-1.
- Riesgo: DELETE elimina fila pero falla el `BUCKET.delete` → mitigación: borrar primero R2, luego D1; si R2 falla devolver 500 sin tocar D1; si R2 OK y D1 falla, el objeto queda huérfano y un job de cleanup lo elimina (riesgo aceptado por baja probabilidad).
- Riesgo: prestador A intenta operar sobre imagen de prestador B → mitigación: handler valida `image.providerId === session.providerId` antes de mutar.

## Métrica de éxito

- Test integración `PATCH .../reorder` con `[42,12,33]` deja filas con `sort_order` 0,1,2.
- Test integración `DELETE` elimina objeto R2 verificable vía `BUCKET.head(key)` y compacta `sort_order` restante.
- Test e2e confirma que clic en `ri-delete-bin-line` quita la card del grid sin recarga completa.
