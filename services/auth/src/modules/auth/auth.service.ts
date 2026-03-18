import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import {
  userRepository,
  sessionRepository,
  loginAttemptRepository,
} from '../../repositories';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  JwtPayload,
} from '../../utils/jwt';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../../utils/email';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import type {
  RegisterInput,
  LoginInput,
  AuthResponse,
  UserResponse,
  AuthTokens,
} from './auth.types';

export class AuthService {
  async register(input: RegisterInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password, username, firstName, lastName, phone } = input;

    if (await userRepository.existsByEmail(email)) {
      throw new ConflictError('Email already registered');
    }

    if (await userRepository.existsByUsername(username)) {
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const verificationToken = uuidv4();

    const isAdminEmail = email.toLowerCase() === config.admin.email.toLowerCase() && config.admin.email !== '';
    const role = isAdminEmail ? 'admin' : 'user';

    const user = await userRepository.create({
      email,
      passwordHash,
      username,
      firstName,
      lastName,
      phone,
      role,
    });

    await userRepository.update(user.id, { verificationToken });

    try {
      await sendVerificationEmail({
        email: user.email,
        username: user.username,
        token: verificationToken,
      });
    } catch (error) {
      logger.warn('Failed to send verification email, user still registered', { userId: user.id });
    }

    const tokens = await this.generateTokens(user.id, user.email, role, ipAddress, userAgent);

    logger.info('User registered', { userId: user.id, email: user.email, role });

    return {
      user: this.formatUserResponse(user, [role]),
      tokens,
    };
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = input;

    const user = await userRepository.findByEmail(email);

    if (!user) {
      await loginAttemptRepository.create({
        email,
        ipAddress: ipAddress || 'unknown',
        success: false,
        userAgent,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Please verify your email before logging in');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is locked. Please try again later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockUntil: Date | undefined;

      if (failedAttempts >= config.security.maxFailedLoginAttempts) {
        lockUntil = new Date(Date.now() + config.security.lockoutDurationMinutes * 60 * 1000);
      }

      await userRepository.incrementFailedLoginAttempts(user.id, lockUntil);

      await loginAttemptRepository.create({
        email,
        ipAddress: ipAddress || 'unknown',
        success: false,
        userAgent,
      });

      if (lockUntil) {
        throw new UnauthorizedError('Account is locked due to too many failed attempts');
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    await userRepository.resetFailedLoginAttempts(user.id);

    await loginAttemptRepository.create({
      email,
      ipAddress: ipAddress || 'unknown',
      success: true,
      userAgent,
    });

    const roles = user.roles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, roles[0] || 'user', ipAddress, userAgent);

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: this.formatUserResponse(user, roles),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = await hashToken(refreshToken);

    const session = await sessionRepository.findByTokenHash(tokenHash);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const roles = user.roles.map((ur) => ur.role.name);

    return this.generateTokens(user.id, user.email, roles[0] || 'user');
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = await hashToken(refreshToken);
      await sessionRepository.deleteByTokenHash(tokenHash);
    } else {
      await sessionRepository.deleteByUserId(userId);
    }

    logger.info('User logged out', { userId });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await userRepository.updatePassword(user.id, newPasswordHash);

    await sessionRepository.deleteByUserId(userId);

    logger.info('Password changed', { userId });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await userRepository.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedError('Invalid verification token');
    }

    await userRepository.update(user.id, {
      isVerified: true,
      verificationToken: null,
    });

    logger.info('Email verified', { userId: user.id });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);

    if (user) {
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await userRepository.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      });

      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (error) {
        logger.warn('Failed to send password reset email', { userId: user.id });
      }

      logger.info('Password reset requested', { userId: user.id, email: user.email });
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const user = await userRepository.findByResetPasswordToken(token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    await userRepository.updatePassword(user.id, passwordHash);

    await sessionRepository.deleteByUserId(user.id);

    logger.info('Password reset', { userId: user.id });
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    return this.formatUserResponse(user, roles);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId,
      email,
      role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sessionRepository.create({
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async getSellerStatus(userId: string): Promise<string> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user.sellerStatus || 'NONE';
  }

  async requestSeller(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    
    if (user.sellerStatus === 'PENDING') {
      throw new ConflictError('Seller request already pending');
    }
    if (user.sellerStatus === 'APPROVED') {
      throw new ConflictError('You are already a seller');
    }

    await userRepository.updateSellerStatus(userId, 'PENDING');
    logger.info('Seller request submitted', { userId });
  }

  async getSellerRequests() {
    return userRepository.findBySellerStatus('PENDING');
  }

  async approveSeller(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');

    if (user.sellerStatus !== 'PENDING') {
      throw new ConflictError('No pending seller request found');
    }

    await userRepository.updateSellerStatus(userId, 'APPROVED');
    logger.info('Seller approved', { userId });
  }

  async rejectSeller(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');

    await userRepository.updateSellerStatus(userId, 'REJECTED');
    logger.info('Seller request rejected', { userId });
  }

  private formatUserResponse(user: any, roles: string[]): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role || 'user',
      sellerStatus: user.sellerStatus || 'NONE',
      isActive: user.isActive,
      isVerified: user.isVerified,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const authService = new AuthService();
