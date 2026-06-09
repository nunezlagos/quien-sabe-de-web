import { sequence } from 'astro/middleware';
import { securityHeaders } from './lib/middleware/security';
import { validateJsonMiddleware } from './lib/middleware/validation';

export const onRequest = sequence(securityHeaders, validateJsonMiddleware);

