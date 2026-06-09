import { defineMiddleware } from 'astro/middleware';

export const securityHeaders = defineMiddleware(async (context, next) => {
  const response = await next();

  const headers = response.headers;

  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
});
