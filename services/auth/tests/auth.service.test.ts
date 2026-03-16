import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest';

const mockExistsByEmail = jest.fn() as Mock<Promise<boolean>, [string]>;
const mockExistsByUsername = jest.fn() as Mock<Promise<boolean>, [string]>;
const mockFindByEmail = jest.fn() as Mock<Promise<any>, [string]>;
const mockFindById = jest.fn() as Mock<Promise<any>, [string]>;
const mockCreate = jest.fn() as Mock<Promise<any>, [any]>;
const mockUpdate = jest.fn() as Mock<Promise<any>, [string, any]>;
const mockResetFailedLoginAttempts = jest.fn() as Mock<Promise<void>, [string]>;
const mockIncrementFailedLoginAttempts = jest.fn() as Mock<Promise<void>, [string, Date | undefined]>;

// Session mocks
const mockSessionCreate = jest.fn() as Mock<Promise<any>, [any]>;
const mockSessionFindByUserId = jest.fn() as Mock<Promise<any[]>, [string]>;
const mockSessionFindByTokenHash = jest.fn() as Mock<Promise<any>, [string]>;
const mockSessionDelete = jest.fn() as Mock<Promise<void>, [string]>;
const mockSessionDeleteByUserId = jest.fn() as Mock<Promise<void>, [string]>;

// Login attempt mock
const mockLoginAttemptCreate = jest.fn() as Mock<Promise<any>, [any]>;

jest.mock('../src/repositories/user.repository', () => ({
  userRepository: {
    existsByEmail: mockExistsByEmail,
    existsByUsername: mockExistsByUsername,
    findByEmail: mockFindByEmail,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    resetFailedLoginAttempts: mockResetFailedLoginAttempts,
    incrementFailedLoginAttempts: mockIncrementFailedLoginAttempts,
  },
}));

jest.mock('../src/repositories/session.repository', () => ({
  sessionRepository: {
    create: mockSessionCreate,
    findByUserId: mockSessionFindByUserId,
    findByTokenHash: mockSessionFindByTokenHash,
    delete: mockSessionDelete,
    deleteByUserId: mockSessionDeleteByUserId,
  },
}));

jest.mock('../src/repositories/login-attempt.repository', () => ({
  loginAttemptRepository: {
    create: mockLoginAttemptCreate,
  },
}));

jest.mock('../src/utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn((token: string) => ({ userId: 'user-id', email: 'test@example.com', role: 'user' })),
  hashToken: jest.fn((token: string) => Promise.resolve(`hashed-${token}`)),
}));

jest.mock('../src/utils/email', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockExistsByEmail.mockResolvedValue(false);
      mockExistsByUsername.mockResolvedValue(false);
      mockCreate.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: false,
      });
      mockUpdate.mockResolvedValue(true);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockExistsByEmail.mockResolvedValue(true);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should throw ConflictError if username already exists', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockExistsByEmail.mockResolvedValue(false);
      mockExistsByUsername.mockResolvedValue(true);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Username already taken');
    });

    it('should throw ValidationError if password is too short', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'short',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockFindByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        isVerified: true,
        failedLoginAttempts: 0,
        roles: [{ role: { name: 'user' } }],
      });
      mockSessionCreate.mockResolvedValue({ id: 'session-id' });
      mockResetFailedLoginAttempts.mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockFindByEmail.mockResolvedValue(null);
      mockLoginAttemptCreate.mockResolvedValue(true);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockFindByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        isVerified: true,
        failedLoginAttempts: 0,
      });
      
      const bcrypt = await import('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });

    it('should throw UnauthorizedError if account is inactive', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockFindByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: false,
        isVerified: true,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Account is disabled');
    });

    it('should throw UnauthorizedError if email not verified', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockFindByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        isVerified: false,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Please verify your email before logging in');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockSessionFindByTokenHash.mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        tokenHash: 'hashed-token',
      });
      mockFindById.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        isActive: true,
        roles: [{ role: { name: 'user' } }],
      });

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if session not found', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockSessionFindByTokenHash.mockResolvedValue(null);

      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      
      mockSessionDeleteByUserId.mockResolvedValue(undefined);

      await expect(authService.logout('user-id')).resolves.not.toThrow();
      expect(mockSessionDeleteByUserId).toHaveBeenCalledWith('user-id');
    });
  });
});
