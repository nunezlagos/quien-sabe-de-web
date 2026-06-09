import { defineMiddleware } from 'astro/middleware';
import { errorResponse } from '../utils/response';

export const validateJsonMiddleware = defineMiddleware(async (ctx, next) => {
  const isApiRoute = ctx.url.pathname.startsWith('/api/');
  const isMutationMethod = ['POST', 'PUT', 'PATCH'].includes(ctx.request.method);

  if (isApiRoute && isMutationMethod) {
    const contentType = ctx.request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return errorResponse('Content-Type must be application/json', 415);
    }

    try {
      const clone = ctx.request.clone();
      await clone.json();
    } catch (e) {
      return errorResponse('Invalid or malformed JSON', 400);
    }
  }

  return next();
});
