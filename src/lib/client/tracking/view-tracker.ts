/**
 * Registra una visita a un perfil de oficio.
 * Importar en páginas de detalle de provider.
 * Llama a POST /api/v1/providers/:id/views si el usuario está autenticado.
 */
export function recordView(tradeId: number): void {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  fetch(`/api/v1/providers/${tradeId}/views`, {
    method: 'POST',
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) console.warn('[view-tracker] falló', res.status);
    })
    .catch(() => {
      // Silencioso; no queremos que afecte UX
    })
    .finally(() => clearTimeout(timeout));
}
