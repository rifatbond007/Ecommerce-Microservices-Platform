import {
  InterServiceConfig,
  SignRequestInput,
  VerifyInput,
  buildSignedHeaders,
  signRequest,
  verifyInterServiceSignature,
} from './signature';
import { InterServiceMiddlewareOptions, createInterServiceMiddleware } from './middleware';

export * from './signature';
export * from './middleware';

/**
 * Binds the helpers to one service's config, so call sites read
 * `buildSignedHeaders({ method, path, body })` with no config argument.
 */
export function createInterService(config: InterServiceConfig) {
  return {
    signRequest: (input: SignRequestInput) => signRequest(config, input),
    buildSignedHeaders: (input: SignRequestInput) => buildSignedHeaders(config, input),
    verifyInterServiceSignature: (input: VerifyInput) => verifyInterServiceSignature(config, input),
    middleware: (options?: InterServiceMiddlewareOptions) =>
      createInterServiceMiddleware(config, options),
  };
}
