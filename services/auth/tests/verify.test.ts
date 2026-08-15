import crypto from 'crypto';
import { verifyInterServiceSignature } from '../src/utils/verify';
import { signRequest, sha256Hex } from '../src/utils/sign';

jest.mock('../src/config', () => ({
  config: {
    interService: {
      secret: 'test-secret-do-not-use-in-prod',
      keyId: 'v1',
      clockSkewSeconds: 60,
    },
  },
}));

const NOW = 1_722_800_123;

describe('inter-service verify helper (auth)', () => {
  describe('happy path', () => {
    it('accepts a valid signature for a GET with empty body', () => {
      const { signature, timestamp, keyId } = signRequest({
        method: 'GET',
        path: '/api/v1/auth/me',
        body: '',
        timestamp: NOW,
        keyId: 'v1',
      });
      expect(() =>
        verifyInterServiceSignature({
          method: 'GET',
          path: '/api/v1/auth/me',
          body: '',
          signature,
          timestamp,
          keyId,
          now: NOW,
        })
      ).not.toThrow();
    });

    it('accepts a valid signature for a POST with a JSON body', () => {
      const body = '{"email":"a@b.com","password":"hunter22"}';
      const { signature, timestamp, keyId } = signRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        body,
        timestamp: NOW,
        keyId: 'v1',
      });
      expect(() =>
        verifyInterServiceSignature({
          method: 'POST',
          path: '/api/v1/auth/login',
          body,
          signature,
          timestamp,
          keyId,
          now: NOW,
        })
      ).not.toThrow();
    });

    it('accepts a signature whose timestamp is exactly at the skew boundary', () => {
      const skew = 60;
      const { signature, timestamp, keyId } = signRequest({
        method: 'GET',
        path: '/api/v1/auth/me',
        body: '',
        timestamp: NOW - skew,
        keyId: 'v1',
      });
      expect(() =>
        verifyInterServiceSignature({
          method: 'GET',
          path: '/api/v1/auth/me',
          body: '',
          signature,
          timestamp,
          keyId,
          now: NOW,
        })
      ).not.toThrow();
    });
  });

  describe('rejection paths', () => {
    const baseSig = {
      method: 'GET',
      path: '/api/v1/auth/me',
      body: '',
      timestamp: NOW.toString(),
      keyId: 'v1',
      signature: 'a'.repeat(64),
      now: NOW,
    };

    it('throws when signature header is missing', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          signature: undefined,
        })
      ).toThrow(/missing/i);
    });

    it('throws when timestamp header is missing', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          timestamp: undefined,
        })
      ).toThrow(/missing/i);
    });

    it('throws when keyId header is missing', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          keyId: undefined,
        })
      ).toThrow(/missing/i);
    });

    it('throws when timestamp is not an integer', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          timestamp: 'not-a-number',
        })
      ).toThrow(/timestamp/i);
    });

    it('throws when timestamp is outside the allowed clock skew', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          timestamp: (NOW - 999).toString(),
        })
      ).toThrow(/clock skew/i);
    });

    it('throws when keyId is not recognized', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          keyId: 'rotated-2026',
        })
      ).toThrow(/key id/i);
    });

    it('throws when signature has wrong length', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          signature: 'tooShort',
        })
      ).toThrow(/invalid/i);
    });

    it('throws when the signature is forged', () => {
      expect(() =>
        verifyInterServiceSignature({
          ...baseSig,
          signature: 'd'.repeat(64),
        })
      ).toThrow(/invalid/i);
    });

    it('throws when the body has been tampered with', () => {
      const { signature, timestamp, keyId } = signRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        body: '{"email":"a@b.com","password":"hunter22"}',
        timestamp: NOW,
        keyId: 'v1',
      });
      expect(() =>
        verifyInterServiceSignature({
          method: 'POST',
          path: '/api/v1/auth/login',
          body: '{"email":"a@b.com","password":"WRONG"}',
          signature,
          timestamp,
          keyId,
          now: NOW,
        })
      ).toThrow(/invalid/i);
    });

    it('throws when the path has been tampered with', () => {
      const { signature, timestamp, keyId } = signRequest({
        method: 'GET',
        path: '/api/v1/auth/me',
        body: '',
        timestamp: NOW,
        keyId: 'v1',
      });
      expect(() =>
        verifyInterServiceSignature({
          method: 'GET',
          path: '/api/v1/auth/admin',
          body: '',
          signature,
          timestamp,
          keyId,
          now: NOW,
        })
      ).toThrow(/invalid/i);
    });

    it('throws when the method has been tampered with', () => {
      const { signature, timestamp, keyId } = signRequest({
        method: 'GET',
        path: '/api/v1/auth/me',
        body: '',
        timestamp: NOW,
        keyId: 'v1',
      });
      expect(() =>
        verifyInterServiceSignature({
          method: 'DELETE',
          path: '/api/v1/auth/me',
          body: '',
          signature,
          timestamp,
          keyId,
          now: NOW,
        })
      ).toThrow(/invalid/i);
    });
  });

  describe('sha256Hex', () => {
    it('matches the canonical sha256 of "abc"', () => {
      expect(sha256Hex('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
    });
  });
});

// Tiny helper to silence the eslint unused import — only `crypto` is used
// transitively via signRequest, but the test file should be self-contained.
void crypto;
