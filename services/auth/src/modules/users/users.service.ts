import { userRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { UserResponse } from '../auth/auth.types';
import type { UpdateProfileInput } from './users.validator';

export class UsersService {
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    return this.formatUserResponse(user, roles);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserResponse> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await userRepository.update(userId, input);

    const roles = user.roles.map((ur) => ur.role.name);

    logger.info('Profile updated', { userId });

    return this.formatUserResponse(updatedUser, roles);
  }

  async deactivateAccount(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    await userRepository.update(userId, { isActive: false });

    logger.info('Account deactivated', { userId });
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

export const usersService = new UsersService();
