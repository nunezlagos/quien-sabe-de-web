export function jsonResponse<T>(data: T, init: ResponseInit = {}): Response {
  const body = JSON.stringify(data);
  return new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 400, details?: unknown): Response {
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) body.details = details;
  return jsonResponse(body, { status });
}