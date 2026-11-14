import { createInterService } from '@ecommerce/inter-service';
import { config } from '../config';

export const interService = createInterService(config.interService);

export const { signRequest, buildSignedHeaders, verifyInterServiceSignature } = interService;

export { sha256Hex } from '@ecommerce/inter-service';
export type {
  SignedHeaders,
  SignRequestInput,
  SignRequestOutput,
  VerifyInput,
} from '@ecommerce/inter-service';
