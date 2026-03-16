import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../src/repositories/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../src/repositories/session.repository', () => ({
  sessionRepository: {
    create: jest.fn(),
    findByUserId: jest.fn(),
    delete: jest.fn(),
    deleteAllByUserId: jest.fn(),
  },
}));

jest.mock('../src/utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
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
      const { userRepository } = await import('../src/repositories/user.repository');
      
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { userRepository } = await import('../src/repositories/user.repository');
      
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
      });

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
      const { userRepository } = await import('../src/repositories/user.repository');
      
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { userRepository } = await import('../src/repositories/user.repository');
      
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { userRepository } = await import('../src/repositories/user.repository');
      
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      });

      const bcrypt = await import('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedError if account is inactive', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { userRepository } = await import('../src/repositories/user.repository');
      
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: false,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Account is inactive');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { sessionRepository } = await import('../src/repositories/session.repository');
      
      (sessionRepository.findByUserId as jest.Mock).mockResolvedValue({
        id: 'session-id',
        refreshToken: 'valid-refresh-token',
      });

      const result = await authService.refreshToken('user-id', 'valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error if session not found', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { sessionRepository } = await import('../src/repositories/session.repository');
      
      (sessionRepository.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.refreshToken('user-id', 'invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { authService } = await import('../src/modules/auth/auth.service');
      const { sessionRepository } = await import('../src/repositories/session.repository');
      
      (sessionRepository.deleteAllByUserId as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.logout('user-id')).resolves.not.toThrow();
      expect(sessionRepository.deleteAllByUserId).toHaveBeenCalledWith('user-id');
    });
  });
});
