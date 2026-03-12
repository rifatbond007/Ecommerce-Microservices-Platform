import prisma from './prisma.client';

export interface CreateLoginAttemptData {
  email: string;
  ipAddress: string;
  success: boolean;
  userAgent?: string;
}

export class LoginAttemptRepository {
  async create(data: CreateLoginAttemptData) {
    return prisma.loginAttempt.create({
      data: {
        email: data.email,
        ipAddress: data.ipAddress,
        success: data.success,
        userAgent: data.userAgent,
      },
    });
  }

  async countRecentAttempts(email: string, windowMinutes: number = 15) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return prisma.loginAttempt.count({
      where: {
        email,
        attemptTime: { gte: since },
        success: false,
      },
    });
  }

  async countRecentAttemptsByIp(ipAddress: string, windowMinutes: number = 15) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return prisma.loginAttempt.count({
      where: {
        ipAddress,
        attemptTime: { gte: since },
        success: false,
      },
    });
  }

  async getRecentAttempts(email: string, limit: number = 10) {
    return prisma.loginAttempt.findMany({
      where: { email },
      orderBy: { attemptTime: 'desc' },
      take: limit,
    });
  }

  async deleteOldAttempts(daysOld: number = 30) {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return prisma.loginAttempt.deleteMany({
      where: {
        attemptTime: { lt: cutoff },
      },
    });
  }
}

export const loginAttemptRepository = new LoginAttemptRepository();
