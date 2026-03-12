export { errorHandler, notFoundHandler } from './error.middleware';
export { authRateLimiter, loginRateLimiter } from './rate-limit.middleware';

export type { AuthenticatedRequest } from '../modules/auth/auth.middleware';
