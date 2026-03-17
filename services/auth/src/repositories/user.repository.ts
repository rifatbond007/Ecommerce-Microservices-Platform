import prisma from './prisma.client';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  sellerStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive?: boolean;
  isVerified?: boolean;
  verificationToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date;
}

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findByVerificationToken(token: string) {
    return prisma.user.findFirst({
      where: { verificationToken: token },
    });
  }

  async findByResetPasswordToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });
  }

  async create(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });
  }

  async update(id: string, data: UpdateUserData) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementFailedLoginAttempts(id: string, lockUntil?: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
        ...(lockUntil && { lockedUntil: lockUntil }),
      },
    });
  }

  async resetFailedLoginAttempts(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }

  async findBySellerStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.user.findMany({
      where: { sellerStatus: status },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        sellerStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSellerStatus(id: string, status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.user.update({
      where: { id },
      data: { sellerStatus: status },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {
        email,  // Use the email parameter
      },
      select: {
        id: true,
      },
    });
    return !!user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: {
        username,  // Use the username parameter
      },
      select: {
        id: true,
      },
    });
    return !!user;
  }
}

export const userRepository = new UserRepository();
