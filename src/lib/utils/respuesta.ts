export function respuestaJson<T>(datos: T, init: ResponseInit = {}): Response {
	const cuerpo = JSON.stringify(datos);
	return new Response(cuerpo, {
		...init,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			...(init.headers ?? {}),
		},
	});
}

export function respuestaError(mensaje: string, status = 400, detalles?: unknown): Response {
	const cuerpo: { error: string; detalles?: unknown } = { error: mensaje };
	if (detalles !== undefined) cuerpo.detalles = detalles;
	return respuestaJson(cuerpo, { status });
}